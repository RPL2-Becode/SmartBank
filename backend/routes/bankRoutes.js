const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/balance', verifyToken, bankController.getBalance);

router.post('/transfer', verifyToken, bankController.transfer);

router.post('/payment', verifyToken, bankController.payment);

router.post('/loan', verifyToken, bankController.requestLoan);

router.get('/loans', verifyToken, bankController.getLoans);

router.post('/loan/pay', verifyToken, bankController.payLoan);

router.get('/ledger', verifyToken, checkRole(['ADMIN', 'TELLER', 'MANAGER']), bankController.getLedger);

router.get('/history', verifyToken, bankController.getHistory);

module.exports = router;
