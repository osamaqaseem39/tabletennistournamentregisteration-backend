const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createTournament,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  registerForTournament,
  getTournamentRegistrations,
  updateRegistrationStatus,
  generateBracket,
  getTournamentMatches,
  updateMatchResult
} = require('../controllers/tournamentController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const tournamentValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Registration deadline must be a valid date'),
  body('maxParticipants')
    .isInt({ min: 16, max: 128 })
    .withMessage('Maximum participants must be between 16 and 128'),
  body('entryFee')
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a positive number'),
  body('prizePool.first')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('First prize must be a positive number'),
  body('prizePool.second')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Second prize must be a positive number'),
  body('prizePool.third')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Third prize must be a positive number')
];

const tournamentUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Registration deadline must be a valid date'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 16, max: 128 })
    .withMessage('Maximum participants must be between 16 and 128'),
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a positive number')
];

const registrationValidation = [
  body('paymentMethod')
    .isIn(['card', 'bank'])
    .withMessage('Payment method must be either card or bank')
];

const matchResultValidation = [
  body('player1Score')
    .isInt({ min: 0, max: 11 })
    .withMessage('Player 1 score must be between 0 and 11'),
  body('player2Score')
    .isInt({ min: 0, max: 11 })
    .withMessage('Player 2 score must be between 0 and 11')
];

const registrationStatusValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting registration')
];

// Tournament CRUD routes
router.post('/', protect, admin, tournamentValidation, validate, createTournament);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.put('/:id', protect, admin, tournamentUpdateValidation, validate, updateTournament);
router.delete('/:id', protect, admin, deleteTournament);

// Tournament registration routes
router.post('/:tournamentId/register', protect, registrationValidation, validate, registerForTournament);
router.get('/:tournamentId/registrations', protect, admin, getTournamentRegistrations);
router.put('/registrations/:registrationId/status', protect, admin, registrationStatusValidation, validate, updateRegistrationStatus);

// Tournament bracket and matches routes
router.post('/:tournamentId/bracket', protect, admin, generateBracket);
router.get('/:tournamentId/matches', getTournamentMatches);
router.put('/matches/:matchId/result', protect, matchResultValidation, validate, updateMatchResult);

module.exports = router; 