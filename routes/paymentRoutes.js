const express = require('express');
const router = express.Router();
const { upload, uploadPaymentProof, getPaymentProof, deletePaymentProof } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Upload payment proof (single file)
router.post('/upload-proof', auth, upload.single('file'), uploadPaymentProof);

// Get payment proof by filename
router.get('/proof/:filename', getPaymentProof);

// Delete payment proof (admin only)
router.delete('/proof/:filename', auth, deletePaymentProof);

module.exports = router; 