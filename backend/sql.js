/**
 * SQL query building utilities
 * Provides safe, parameterized query construction helpers
 */

/**
 * Builds a parameterized SQL query with conditional WHERE clauses
 * @param {Object} options - Query building options
 * @param {string} options.baseQuery - Base SQL query (e.g., 'SELECT * FROM table')
 * @param {Array<{condition: string, param: any}>} options.conditions - Array of condition objects
 * @param {string} options.orderBy - ORDER BY clause (optional)
 * @param {number} options.limit - LIMIT clause (optional)
 * @returns {{query: string, params: Array}} - Object with final query and parameters array
 */
export function buildWhereQuery({ baseQuery, conditions = [], orderBy, limit }) {
  const params = [];
  const whereClauses = [];

  conditions.forEach(({ condition, param }) => {
    if (param !== undefined && param !== null && param !== '') {
      const paramIndex = params.length + 1;
      whereClauses.push(condition.replace('$?', `$${paramIndex}`));
      params.push(param);
    }
  });

  let query = baseQuery;
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  return { query, params };
}

/**
 * Builds a WHERE clause array and params array for manual query construction
 * This is useful when you want more control over the query structure
 * @param {Array<{condition: string, param: any, static?: boolean}>} conditions - Array of condition objects
 * @returns {{whereClauses: Array<string>, params: Array}} - Object with where clauses and parameters
 */
export function buildWhereClauses(conditions = []) {
  const params = [];
  const whereClauses = [];

  conditions.forEach(({ condition, param, static: isStatic = false }) => {
    if (isStatic) {
      // Static condition (no parameter), e.g., 'date >= CURRENT_DATE'
      whereClauses.push(condition);
    } else if (param !== undefined && param !== null && param !== '') {
      // Parameterized condition - replace $? with actual parameter index
      const paramIndex = params.length + 1;
      whereClauses.push(condition.replace('$?', `$${paramIndex}`));
      params.push(param);
    }
  });

  return { whereClauses, params };
}
