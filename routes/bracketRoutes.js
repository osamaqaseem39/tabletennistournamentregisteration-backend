const express = require('express');
const router = express.Router();
const {
  generateTournamentBracket,
  seedTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  getBracketStats
} = require('../controllers/bracketController');
const { protect, admin } = require('../middleware/auth');

// Generate tournament bracket (admin only)
router.post('/generate/:tournamentId', protect, admin, generateTournamentBracket);

// Seed tournament bracket (admin only)
router.post('/seed/:bracketId', protect, admin, seedTournamentBracket);

// Get bracket statistics (public)
router.get('/:tournamentId/stats', getBracketStats);

// Update match result (admin only)
router.put('/:bracketId/match/:nodeId', protect, admin, updateMatchResult);

// Get tournament bracket (public) - this should be last to avoid conflicts
router.get('/:tournamentId', getTournamentBracket);

module.exports = router; 