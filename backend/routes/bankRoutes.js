const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
    validateTransfer,
    validatePayment,
    validateLoan,
    validatePayLoan,
} = require('../middlewares/validationMiddleware');

router.get('/balance', verifyToken, bankController.getBalance);

router.post('/transfer', verifyToken, validateTransfer, bankController.transfer);

router.post('/payment', verifyToken, validatePayment, bankController.payment);

router.post('/loan', verifyToken, validateLoan, bankController.requestLoan);

router.get('/loans', verifyToken, bankController.getLoans);

router.post('/loan/pay', verifyToken, validatePayLoan, bankController.payLoan);

router.get(
    '/ledger',
    verifyToken,
    checkRole(['ADMIN', 'TELLER', 'MANAGER']),
    bankController.getLedger,
);

router.get('/history', verifyToken, bankController.getHistory);

module.exports = router;
