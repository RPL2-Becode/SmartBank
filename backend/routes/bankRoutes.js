const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');
const { validateTransfer, validatePayment, validateLoan } = require('../middlewares/validationMiddleware');

router.get('/balance', verifyToken, bankController.getBalance);

router.post('/transfer', verifyToken, validateTransfer, bankController.transfer);

router.post('/payment', verifyToken, validatePayment, bankController.payment);

router.post('/loan', verifyToken, validateLoan, bankController.requestLoan);

router.post('/loan/pay', verifyToken, bankController.payLoan);

router.get('/ledger', verifyToken, requireRoles('ADMIN', 'TELLER', 'MANAGER'), bankController.getLedger);

module.exports = router;
