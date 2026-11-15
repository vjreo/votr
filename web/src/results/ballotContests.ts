import { AMENDMENTS, CHARLOTTE_BONDS, getCandidatesForLocation } from '../data/ballot';

type BallotLocation = Parameters<typeof getCandidatesForLocation>[0] & { isCharlotte?: boolean };

const MEASURE_CONTEST: Record<string, string> = {
  'nc-amend-photo-id-2026': 'CONSTITUTIONAL AMENDMENT - REQUIRE PHOTO ID FOR VOTING',
  'nc-amend-income-tax-2026': 'CONSTITUTIONAL AMENDMENT - MAXIMUM INCOME TAX RATE OF 3.5%',
  'nc-amend-property-tax-2026': 'CONSTITUTIONAL AMENDMENT - PROPERTY TAX LEVY LIMIT',
  'clt-bonds-transportation-2026': 'CITY OF CHARLOTTE TRANSPORTATION BONDS REFERENDUM',
  'clt-bonds-housing-2026': 'CITY OF CHARLOTTE HOUSING BONDS REFERENDUM',
  'clt-bonds-neighborhood-2026': 'CITY OF CHARLOTTE NEIGHBORHOOD IMPROVEMENT BONDS REFERENDUM',
};

/** Map a VOTR office title onto the NCSBE contest name. Null means this office is not in that file. */
export function ncsbeContestNameForOffice(office: string): string | null {
  if (office === 'U.S. Senate') return 'US SENATE (VOTE FOR 1)';
  const house = office.match(/^U\.S\. House NC-(\d+)$/);
  if (house) {
    return `US HOUSE OF REPRESENTATIVES DISTRICT ${house[1].padStart(2, '0')} (VOTE FOR 1)`;
  }
  const supreme = office.match(/^NC Supreme Court Seat (\d+)$/);
  if (supreme) return `NC SUPREME COURT ASSOCIATE JUSTICE SEAT ${supreme[1]} (VOTE FOR 1)`;
  const appeals = office.match(/^NC Court of Appeals Seat (\d+)$/);
  if (appeals) return `NC COURT OF APPEALS JUDGE SEAT ${appeals[1]} (VOTE FOR 1)`;
  const senate = office.match(/^NC Senate District (\d+)$/);
  if (senate) return `NC STATE SENATE DISTRICT ${senate[1]} (VOTE FOR 1)`;
  const stateHouse = office.match(/^NC House District (\d+)$/);
  if (stateHouse) {
    return `NC HOUSE OF REPRESENTATIVES DISTRICT ${stateHouse[1].padStart(3, '0')} (VOTE FOR 1)`;
  }
  if (office === 'Mecklenburg Commissioners At-Large') {
    return 'MECKLENBURG COUNTY BOARD OF COMMISSIONERS AT-LARGE (VOTE FOR 3)';
  }
  const commission = office.match(/^Mecklenburg Commission District (\d+)$/);
  if (commission) {
    return `MECKLENBURG COUNTY BOARD OF COMMISSIONERS DISTRICT ${commission[1].padStart(2, '0')} (VOTE FOR 1)`;
  }
  if (office === 'Mecklenburg Sheriff') return 'MECKLENBURG COUNTY SHERIFF (VOTE FOR 1)';
  if (office.startsWith('District Attorney')) return 'DISTRICT ATTORNEY DISTRICT 26 (VOTE FOR 1)';
  return null;
}

/** Contest names for the ballot this location already shows, in that order. */
export function contestNamesForLocation(location: BallotLocation): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | null) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  };
  for (const candidate of getCandidatesForLocation(location)) {
    add(ncsbeContestNameForOffice(candidate.office));
  }
  for (const measure of AMENDMENTS) add(MEASURE_CONTEST[measure.id] ?? null);
  if (location.isCharlotte) {
    for (const measure of CHARLOTTE_BONDS) add(MEASURE_CONTEST[measure.id] ?? null);
  }
  return names;
}
