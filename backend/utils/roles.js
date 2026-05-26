/**
 * Role mapping between frontend (lowercase) and backend (UPPERCASE).
 *
 * Database/JWT canonical roles: NASABAH, ADMIN, TELLER, MANAGER
 * Frontend canonical roles:     nasabah, admin, teller, manager
 *
 * Legacy aliases (user, developer, insight_readonly) are accepted as input
 * for backward compatibility but always normalized to one of the four
 * canonical roles in storage and in API responses.
 */

const BACKEND_ROLES = ['NASABAH', 'ADMIN', 'TELLER', 'MANAGER'];
const FRONTEND_ROLES = ['nasabah', 'admin', 'teller', 'manager'];

/**
 * Map any incoming role value (frontend lowercase, backend uppercase, or
 * legacy alias) to the canonical backend role used in DB and JWT.
 *
 * @param {string|undefined|null} input
 * @returns {'NASABAH'|'ADMIN'|'TELLER'|'MANAGER'}
 */
function frontendToBackendRole(input) {
  if (typeof input !== 'string') return 'NASABAH';
  const normalized = input.trim().toLowerCase();

  switch (normalized) {
    case 'nasabah':
    case 'user':
      return 'NASABAH';
    case 'admin':
    case 'developer':
      return 'ADMIN';
    case 'teller':
      return 'TELLER';
    case 'manager':
      return 'MANAGER';
    case 'insight_readonly':
      // Insight-only legacy alias — treat as nasabah by default;
      // upgrade to a dedicated role later if needed.
      return 'NASABAH';
    default:
      return 'NASABAH';
  }
}

/**
 * Map a canonical backend role (UPPERCASE) to the frontend role (lowercase).
 * Always returns one of nasabah | admin | teller | manager so the UI can
 * rely on a stable role enum.
 *
 * @param {string|undefined|null} input
 * @returns {'nasabah'|'admin'|'teller'|'manager'}
 */
function backendToFrontendRole(input) {
  if (typeof input !== 'string') return 'nasabah';
  const normalized = input.trim().toUpperCase();

  switch (normalized) {
    case 'NASABAH':
      return 'nasabah';
    case 'ADMIN':
      return 'admin';
    case 'TELLER':
      return 'teller';
    case 'MANAGER':
      return 'manager';
    default:
      // Legacy backend roles (DEVELOPER etc.) collapse safely.
      if (normalized === 'DEVELOPER') return 'admin';
      return 'nasabah';
  }
}

/**
 * @param {string} role
 * @returns {boolean}
 */
function isBackendRole(role) {
  return typeof role === 'string' && BACKEND_ROLES.includes(role);
}

/**
 * @param {string} role
 * @returns {boolean}
 */
function isFrontendRole(role) {
  return typeof role === 'string' && FRONTEND_ROLES.includes(role);
}

module.exports = {
  BACKEND_ROLES,
  FRONTEND_ROLES,
  frontendToBackendRole,
  backendToFrontendRole,
  isBackendRole,
  isFrontendRole,
};
