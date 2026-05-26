const FRONTEND_ROLES = ['nasabah', 'admin', 'teller', 'manager'];
const BACKEND_ROLES = ['NASABAH', 'ADMIN', 'TELLER', 'MANAGER'];

const frontendToBackendRole = {
    nasabah: 'NASABAH',
    admin: 'ADMIN',
    teller: 'TELLER',
    manager: 'MANAGER',
    user: 'NASABAH',
    developer: 'TELLER',
    insight_readonly: 'MANAGER'
};

const backendToFrontendRole = {
    NASABAH: 'nasabah',
    ADMIN: 'admin',
    TELLER: 'teller',
    MANAGER: 'manager',
    USER: 'nasabah',
    DEVELOPER: 'teller',
    INSIGHT_READONLY: 'manager'
};

function normalizeFrontendRole(role = 'nasabah') {
    const key = String(role || 'nasabah').trim().toLowerCase();
    return frontendToBackendRole[key] ? key : null;
}

function toBackendRole(role = 'nasabah') {
    const key = normalizeFrontendRole(role);
    return key ? frontendToBackendRole[key] : null;
}

function toFrontendRole(role = 'NASABAH') {
    const key = String(role || 'NASABAH').trim().toUpperCase();
    return backendToFrontendRole[key] || null;
}

function isBackendRole(role) {
    return BACKEND_ROLES.includes(role);
}

module.exports = {
    FRONTEND_ROLES,
    BACKEND_ROLES,
    frontendToBackendRole,
    backendToFrontendRole,
    normalizeFrontendRole,
    toBackendRole,
    toFrontendRole,
    isBackendRole
};
