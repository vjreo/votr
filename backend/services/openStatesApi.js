/**
 * Open States API v3 Service
 * Fetches legislators and officials for US states
 * Docs: https://v3.openstates.org/docs/
 * Register: https://openstates.org/accounts/signup/
 */

import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const OPEN_STATES_API_KEY = process.env.OPEN_STATES_API_KEY;
const BASE_URL = 'https://v3.openstates.org';

/**
 * Get legislators for a jurisdiction (e.g. North Carolina)
 * @param {string} jurisdiction - State name or OCD ID (e.g. "North Carolina", "nc")
 * @param {Object} options - { perPage, page }
 * @returns {Promise<Array>} Array of person objects with current_role
 */
async function getPeopleByJurisdiction(jurisdiction, options = {}) {
  if (!OPEN_STATES_API_KEY) {
    logger.debug('OPEN_STATES_API_KEY not set; skipping Open States fetch');
    return [];
  }

  try {
    const params = new URLSearchParams({
      jurisdiction: jurisdiction,
      per_page: String(options.perPage || 100),
      page: String(options.page || 1),
      apikey: OPEN_STATES_API_KEY,
    });

    const response = await axios.get(`${BASE_URL}/people?${params}`, {
      headers: { 'X-API-KEY': OPEN_STATES_API_KEY },
      timeout: 10000,
    });

    const data = response.data;
    const results = data?.results || [];
    const pagination = data?.pagination || {};
    const totalItems = pagination.total_items || 0;

    if (totalItems > (options.perPage || 100) && pagination.max_page > 1) {
      const allResults = [...results];
      for (let p = 2; p <= Math.min(pagination.max_page, 5); p++) {
        const next = await getPeopleByJurisdiction(jurisdiction, { ...options, page: p });
        allResults.push(...next);
      }
      return allResults;
    }

    return results;
  } catch (error) {
    logger.warn('Open States getPeopleByJurisdiction failed:', error.response?.status, error.message);
    return [];
  }
}

/**
 * Get legislators for a geographic point (lat/lng)
 * Returns state legislators + US Congress for that location
 * Note: Governors & mayors are NOT included per Open States docs
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Array of person objects
 */
async function getPeopleByGeo(lat, lng) {
  if (!OPEN_STATES_API_KEY) {
    logger.debug('OPEN_STATES_API_KEY not set; skipping Open States geo fetch');
    return [];
  }

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      apikey: OPEN_STATES_API_KEY,
    });

    const response = await axios.get(`${BASE_URL}/people.geo?${params}`, {
      headers: { 'X-API-KEY': OPEN_STATES_API_KEY },
      timeout: 10000,
    });

    const data = response.data;
    return data?.results || [];
  } catch (error) {
    logger.warn('Open States getPeopleByGeo failed:', error.response?.status, error.message);
    return [];
  }
}

/**
 * Build career array from Open States person roles
 * Open States person has roles[] with type, start_date, end_date, district
 * @param {Object} person - Open States Person object
 * @param {Object} currentRole - Current role for fallback
 * @returns {Array<{title: string, period: string, description?: string}>}
 */
function buildCareerFromRoles(person, currentRole) {
  const roles = person.roles || [];
  const career = [];

  const roleTypeToTitle = (r) => {
    const org = r.org_classification || r.type || '';
    const dist = r.district != null ? `, District ${r.district}` : '';
    if (org === 'upper') return `NC State Senator${dist}`;
    if (org === 'lower') return `NC House of Representatives${dist}`;
    if (r.type === 'legislature') return `Legislator${dist}`;
    if (r.role === 'representative' || (r.division_id && r.division_id.includes('cd:'))) {
      return `U.S. Representative${dist}`;
    }
    return r.title || 'Legislator';
  };

  for (const r of roles) {
    const start = r.start_date || '';
    const end = r.end_date || 'Present';
    const period = start ? `${start} - ${end}` : end;
    career.push({
      title: roleTypeToTitle(r),
      period,
    });
  }

  if (career.length === 0 && currentRole) {
    const title = roleTypeToTitle(currentRole);
    career.push({ title, period: 'Present' });
  }

  return career;
}

/**
 * Map Open States person to our candidate format
 * @param {Object} person - Open States Person object
 * @returns {Object} Normalized candidate for DB/API
 */
function mapPersonToCandidate(person, stateCode = 'NC') {
  const role = person.current_role || {};
  const title = role.title || 'Legislator';
  const district = role.district != null ? String(role.district) : role.division_id?.match(/sld[ul]:(\d+)/)?.[1] || role.division_id?.match(/cd:(\d+)/)?.[1] || null;
  const orgClass = role.org_classification || role.type || '';

  let office = title;
  if (district) {
    office = `${title}, District ${district}`;
  }
  if (orgClass === 'upper') {
    office = `NC State Senate${district ? `, District ${district}` : ''}`;
  } else if (orgClass === 'lower') {
    office = `NC House of Representatives${district ? `, District ${district}` : ''}`;
  } else if (role.division_id && role.division_id.includes('cd:')) {
    office = `U.S. House of Representatives${district ? `, District ${district}` : ''}`;
  }

  const party = person.party || 'Unknown';
  const partyNormalized = party.includes('Democratic') ? 'Democratic Party' : party.includes('Republican') ? 'Republican Party' : party;

  let officeLevel = 'state_legislature';
  if (orgClass === 'upper' || orgClass === 'lower') {
    officeLevel = 'state_legislature';
  } else if (role.division_id && role.division_id.includes('cd:')) {
    officeLevel = 'federal';
  } else {
    officeLevel = 'state';
  }

  const career = buildCareerFromRoles(person, role);

  return {
    name: person.name,
    office,
    officeLevel,
    party: partyNormalized,
    photoUrl: person.image || null,
    bio: null,
    district,
    state: stateCode,
    positions: [],
    career,
    apiSource: 'open_states',
    openStatesId: person.id,
  };
}

/**
 * Fetch NC state legislators from Open States and return normalized candidates
 * @param {Object} options - { lat, lng } for geo lookup, or omit for full state list
 * @returns {Promise<Array>}
 */
export async function getNCLegislators(options = {}) {
  const { lat, lng } = options;

  let people = [];
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    people = await getPeopleByGeo(lat, lng);
  } else {
    people = await getPeopleByJurisdiction('North Carolina', { perPage: 100 });
  }

  // Include state legislators (upper/lower) and US House (division_id contains cd:)
  return people
    .filter((p) => {
      if (!p.current_role) return false;
      const org = p.current_role.org_classification || p.current_role.type || '';
      const divId = p.current_role.division_id || '';
      return org === 'upper' || org === 'lower' || org === 'legislature' || divId.includes('cd:');
    })
    .map((p) => mapPersonToCandidate(p, 'NC'));
}

export default {
  getPeopleByJurisdiction,
  getPeopleByGeo,
  getNCLegislators,
  mapPersonToCandidate,
};
