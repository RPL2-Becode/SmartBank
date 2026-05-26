const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');
const { validateGatewayCreate } = require('../middlewares/validationMiddleware');

function verifyGatewayKey(req, res, next) {
    if (!process.env.GATEWAY_API_KEY) return next();

    const providedKey = req.headers['x-gateway-key'];
    if (providedKey !== process.env.GATEWAY_API_KEY) {
        return res.status(401).json({ status: 'error', message: 'Gateway key tidak valid' });
    }

    return next();
}

router.use(verifyGatewayKey);

router.post('/payment-requests', validateGatewayCreate, gatewayController.createPaymentRequest);
router.get('/payment-requests', gatewayController.listPaymentRequests);
router.get('/payment-requests/:requestId', gatewayController.getPaymentRequest);
router.post('/payment-requests/:requestId/process', gatewayController.processPaymentRequest);

module.exports = router;
