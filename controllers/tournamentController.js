const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const TournamentRegistration = require('../models/TournamentRegistration');
const User = require('../models/User');

// Create a new tournament
const createTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      entryFee,
      prizePool
    } = req.body;

    // Validate dates
    if (new Date(startDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be in the future'
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (new Date(registrationDeadline) >= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be before start date'
      });
    }

    const tournament = new Tournament({
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      entryFee,
      prizePool,
      createdBy: req.user.id
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tournament',
      error: error.message
    });
  }
};

// Get all tournaments
const getTournaments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (status) query.status = status;

    const tournaments = await Tournament.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tournament.countDocuments(query);

    res.json({
      success: true,
      data: tournaments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTournaments: total
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournaments',
      error: error.message
    });
  }
};

// Get tournament by ID
const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate({
        path: 'registrations',
        populate: { path: 'player', select: 'firstName lastName email phone' }
      });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament',
      error: error.message
    });
  }
};

// Update tournament
const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Only creator or admin can update
    if (tournament.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tournament'
      });
    }

    // Prevent updates if tournament has started
    if (tournament.status !== 'registration' && new Date() >= tournament.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update tournament after it has started'
      });
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: updatedTournament
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tournament',
      error: error.message
    });
  }
};

// Delete tournament
const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Only creator or admin can delete
    if (tournament.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tournament'
      });
    }

    // Prevent deletion if tournament has participants
    if (tournament.currentParticipants > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tournament with participants'
      });
    }

    tournament.isActive = false;
    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tournament',
      error: error.message
    });
  }
};

// Register for tournament
const registerForTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { paymentMethod } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Tournament registration is not open'
      });
    }

    if (new Date() >= tournament.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    if (tournament.isFull) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Check if user is already registered
    const existingRegistration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      player: req.user.id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this tournament'
      });
    }

    const registration = new TournamentRegistration({
      tournament: tournamentId,
      player: req.user.id,
      paymentMethod,
      entryFee: tournament.entryFee
    });

    await registration.save();

    // Increment participant count
    await tournament.addParticipant();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: registration
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering for tournament',
      error: error.message
    });
  }
};

// Get tournament registrations
const getTournamentRegistrations = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.query;

    const query = { tournament: tournamentId };
    if (status) query.status = status;

    const registrations = await TournamentRegistration.find(query)
      .populate('player', 'firstName lastName email phone')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
};

// Approve/reject tournament registration
const updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status, rejectionReason } = req.body;

    const registration = await TournamentRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (status === 'approved') {
      await registration.approve(req.user.id);
    } else if (status === 'rejected') {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      await registration.reject(req.user.id, rejectionReason);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    res.json({
      success: true,
      message: `Registration ${status} successfully`,
      data: registration
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating registration status',
      error: error.message
    });
  }
};

// Generate tournament bracket
const generateBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status !== 'seeding') {
      return res.status(400).json({
        success: false,
        message: 'Tournament must be in seeding status to generate bracket'
      });
    }

    // Get approved registrations
    const registrations = await TournamentRegistration.getApprovedRegistrations(tournamentId);
    
    if (registrations.length < 16) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 16 approved registrations to generate bracket'
      });
    }

    // Simple seeding logic (can be enhanced)
    const seededPlayers = registrations
      .sort((a, b) => (b.seed || 0) - (a.seed || 0))
      .slice(0, 16);

    // Generate matches for round of 16
    const matches = [];
    for (let i = 0; i < seededPlayers.length; i += 2) {
      const match = new Match({
        tournament: tournamentId,
        player1: seededPlayers[i].player._id,
        player2: seededPlayers[i + 1].player._id,
        round: 'round_of_16',
        matchNumber: matches.length + 1,
        scheduledTime: new Date(tournament.startDate.getTime() + (matches.length * 30 * 60000)) // 30 min intervals
      });
      matches.push(match);
    }

    await Match.insertMany(matches);

    // Update tournament status
    tournament.status = 'active';
    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament bracket generated successfully',
      data: {
        tournament,
        matches: matches.length
      }
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating bracket',
      error: error.message
    });
  }
};

// Get tournament matches
const getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, status } = req.query;

    const query = { tournament: tournamentId };
    if (round) query.round = round;
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('player1', 'firstName lastName')
      .populate('player2', 'firstName lastName')
      .populate('winner', 'firstName lastName')
      .populate('loser', 'firstName lastName')
      .populate('referee', 'firstName lastName')
      .sort({ round: 1, matchNumber: 1 });

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching matches',
      error: error.message
    });
  }
};

// Update match result
const updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { player1Score, player2Score } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Only referee or admin can update match results
    if (match.referee?.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update match results'
      });
    }

    await match.addSetResult(player1Score, player2Score);

    res.json({
      success: true,
      message: 'Match result updated successfully',
      data: match
    });
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating match result',
      error: error.message
    });
  }
};

module.exports = {
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
}; 