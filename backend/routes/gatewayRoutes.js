const express = require('express');
const router = express.Router();

const gatewayController = require('../controllers/gatewayController');
const { validateGatewayCreate } = require('../middlewares/validationMiddleware');

// NOTE: For the P0 foundation we expose the gateway endpoints without
// per-source-app authentication so that internal demos and tests can
// exercise the lifecycle. Production deployments must add a signed
// service-account check / shared secret before mounting this router on
// a public host. This is called out as remaining risk in the PR.

router.post('/payment-requests', validateGatewayCreate, gatewayController.createPaymentRequest);

router.get('/payment-requests', gatewayController.listPaymentRequests);

router.get('/payment-requests/:requestId', gatewayController.getPaymentRequest);

router.post('/payment-requests/:requestId/process', gatewayController.processPaymentRequest);

module.exports = router;
