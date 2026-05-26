const { toBackendRole } = require('../utils/roles');

const MAX_MONEY_AMOUNT = 1000000000;
const USER_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateMoneyAmount(value, field = 'amount', max = MAX_MONEY_AMOUNT) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `${field} harus berupa number yang valid`;
    }
    if (value <= 0) {
        return `${field} harus lebih besar dari 0`;
    }
    if (value > max) {
        return `${field} melebihi batas maksimal ${max}`;
    }
    if (Math.round(value * 100) !== value * 100) {
        return `${field} maksimal 2 angka desimal`;
    }
    return null;
}

function requireString(data, field, options = {}) {
    const value = data[field];
    if (typeof value !== 'string') return `${field} harus berupa string`;
    const trimmed = value.trim();
    if (options.required !== false && !trimmed) return `${field} tidak boleh kosong`;
    if (options.max && trimmed.length > options.max) return `${field} maksimal ${options.max} karakter`;
    if (options.min && trimmed.length < options.min) return `${field} minimal ${options.min} karakter`;
    if (options.pattern && !options.pattern.test(trimmed)) return options.patternMessage || `${field} memiliki format tidak valid`;
    data[field] = trimmed;
    return null;
}

function validationError(res, errors) {
    return res.status(400).json({
        status: 'error',
        message: 'Validasi gagal',
        errors
    });
}

function validateRegister(req, res, next) {
    const data = { ...req.body };
    const errors = [];

    [
        requireString(data, 'userId', {
            max: 50,
            pattern: USER_ID_PATTERN,
            patternMessage: 'userId hanya boleh berisi huruf, angka, underscore, dan dash'
        }),
        requireString(data, 'name', { max: 100 }),
        requireString(data, 'password', { min: 8, max: 255 })
    ].forEach((error) => {
        if (error) errors.push(error);
    });

    const backendRole = toBackendRole(data.role || 'nasabah');
    if (!backendRole) {
        errors.push('role harus salah satu dari nasabah, admin, teller, atau manager');
    } else {
        data.role = backendRole;
    }

    if (data.tier !== undefined) {
        const tierError = requireString(data, 'tier', { required: false, max: 20 });
        if (tierError) errors.push(tierError);
    }

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

function validateLogin(req, res, next) {
    const data = { ...req.body };
    const errors = [];

    [requireString(data, 'userId', { max: 50 }), requireString(data, 'password', { min: 1, max: 255 })].forEach((error) => {
        if (error) errors.push(error);
    });

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

function validateTransfer(req, res, next) {
    const data = { ...req.body };
    const errors = [];

    const toUserIdError = requireString(data, 'toUserId', { max: 50, pattern: USER_ID_PATTERN });
    if (toUserIdError) errors.push(toUserIdError);
    const amountError = validateMoneyAmount(data.amount);
    if (amountError) errors.push(amountError);

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

function validatePayment(req, res, next) {
    const data = { ...req.body };
    const errors = [];

    const toUserIdError = requireString(data, 'toUserId', { max: 50, pattern: USER_ID_PATTERN });
    if (toUserIdError) errors.push(toUserIdError);
    const amountError = validateMoneyAmount(data.amount);
    if (amountError) errors.push(amountError);
    if (data.type !== undefined) {
        const typeError = requireString(data, 'type', { required: false, max: 50 });
        if (typeError) errors.push(typeError);
    }
    if (data.description !== undefined) {
        const descriptionError = requireString(data, 'description', { required: false, max: 255 });
        if (descriptionError) errors.push(descriptionError);
    }

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

function validateLoan(req, res, next) {
    const data = { ...req.body };
    const errors = [];
    const amountError = validateMoneyAmount(data.amount, 'amount', 100000);
    if (amountError) errors.push(amountError);

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

function validateGatewayCreate(req, res, next) {
    const data = { ...req.body };
    const errors = [];

    [
        requireString(data, 'requestId', { max: 100 }),
        requireString(data, 'sourceApp', { max: 100 }),
        requireString(data, 'fromUserId', { max: 50, pattern: USER_ID_PATTERN }),
        requireString(data, 'toUserId', { max: 50, pattern: USER_ID_PATTERN }),
        requireString(data, 'type', { max: 50 })
    ].forEach((error) => {
        if (error) errors.push(error);
    });

    const amountError = validateMoneyAmount(data.amount);
    if (amountError) errors.push(amountError);

    if (data.idempotencyKey !== undefined && data.idempotencyKey !== null) {
        const idempotencyError = requireString(data, 'idempotencyKey', { required: false, max: 150 });
        if (idempotencyError) errors.push(idempotencyError);
        if (!data.idempotencyKey) data.idempotencyKey = null;
    } else {
        data.idempotencyKey = null;
    }

    if (data.metadata !== undefined && !isPlainObject(data.metadata)) {
        errors.push('metadata harus berupa object JSON');
    }

    if (errors.length) return validationError(res, errors);
    req.validatedData = data;
    return next();
}

module.exports = {
    MAX_MONEY_AMOUNT,
    USER_ID_PATTERN,
    validateMoneyAmount,
    validateRegister,
    validateLogin,
    validateTransfer,
    validatePayment,
    validateLoan,
    validateGatewayCreate
};
