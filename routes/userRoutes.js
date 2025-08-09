const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadPaymentProof,
  getUsers,
  updateUserStatus,
  validateReferralCode,
  getReferralStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('dateOfBirth').isISO8601().withMessage('Please enter a valid date of birth'),
  body('paymentMethod').isIn(['card', 'bank']).withMessage('Invalid payment method')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const profileUpdateValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date of birth')
];

const statusUpdateValidation = [
  body('registrationStatus').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid registration status'),
  body('paymentStatus').optional().isIn(['pending', 'completed', 'failed']).withMessage('Invalid payment status')
];

// Public routes
router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);
router.post('/validate-referral', validateReferralCode);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, profileUpdateValidation, validate, updateUserProfile);
router.post('/payment-proof', protect, upload.single('paymentProof'), uploadPaymentProof);
router.get('/referral-stats', protect, getReferralStats);

// Admin routes
router.get('/', protect, admin, getUsers);
router.put('/:id/status', protect, admin, statusUpdateValidation, validate, updateUserStatus);

module.exports = router; 