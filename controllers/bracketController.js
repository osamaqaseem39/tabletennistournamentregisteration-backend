const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const TournamentBracket = require('../models/TournamentBracket');
const Match = require('../models/Match');
const User = require('../models/User');


// Generate tournament bracket after registration deadline
const generateTournamentBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Check if tournament exists and is in registration phase
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
        message: 'Tournament is not in registration phase'
      });
    }

    // Check if registration deadline has passed
    if (new Date() < tournament.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has not passed yet'
      });
    }

    // Get all confirmed registrations
    const registrations = await TournamentRegistration.find({
      tournament: tournamentId,
      status: 'confirmed'
    }).populate('user', 'name email');

    if (registrations.length < 16) {
      return res.status(400).json({
        success: false,
        message: 'Minimum 16 participants required to generate bracket'
      });
    }

    // Check if bracket already exists
    const existingBracket = await TournamentBracket.findOne({ tournament: tournamentId });
    if (existingBracket) {
      return res.status(400).json({
        success: false,
        message: 'Tournament bracket already exists'
      });
    }

    // Calculate total rounds based on participant count
    let totalRounds;
    let roundNames;
    
    if (registrations.length <= 16) {
      totalRounds = 4;
      roundNames = ['round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    } else if (registrations.length <= 32) {
      totalRounds = 5;
      roundNames = ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    } else if (registrations.length <= 64) {
      totalRounds = 6;
      roundNames = ['round_of_64', 'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    } else {
      totalRounds = 7;
      roundNames = ['round_of_128', 'round_of_64', 'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    }

    // Create bracket nodes
    const nodes = [];
    let matchNumber = 1;

    // Generate first round matches
    const firstRoundName = roundNames[0];
    const firstRoundMatches = Math.ceil(registrations.length / 2);
    
    for (let i = 0; i < firstRoundMatches; i++) {
      const node = {
        round: firstRoundName,
        matchNumber: matchNumber++,
        position: { x: i, y: 0 },
        status: 'pending'
      };

      // Assign players to matches
      if (i * 2 < registrations.length) {
        node.player1 = registrations[i * 2].user._id;
      }
      if (i * 2 + 1 < registrations.length) {
        node.player2 = registrations[i * 2 + 1].user._id;
      }

      nodes.push(node);
    }

    // Generate subsequent round placeholders
    for (let roundIndex = 1; roundIndex < roundNames.length; roundIndex++) {
      const roundName = roundNames[roundIndex];
      const matchesInRound = Math.ceil(firstRoundMatches / Math.pow(2, roundIndex));
      
      for (let i = 0; i < matchesInRound; i++) {
        nodes.push({
          round: roundName,
          matchNumber: matchNumber++,
          position: { x: i, y: roundIndex },
          status: 'pending'
        });
      }
    }

    // Create tournament bracket
    const tournamentBracket = new TournamentBracket({
      tournament: tournamentId,
      nodes,
      totalRounds,
      currentRound: firstRoundName,
      status: 'generated'
    });

    await tournamentBracket.save();

    // Update tournament status
    tournament.status = 'seeding';
    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament bracket generated successfully',
      data: {
        bracketId: tournamentBracket._id,
        totalRounds,
        currentRound: firstRoundName,
        totalMatches: nodes.length,
        firstRoundMatches
      }
    });

  } catch (error) {
    console.error('Error generating tournament bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Seed players in the bracket (optional seeding based on ranking)
const seedTournamentBracket = async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { seedOrder } = req.body; // Array of user IDs in seeding order

    const bracket = await TournamentBracket.findById(bracketId);
    if (!bracket) {
      return res.status(404).json({
        success: false,
        message: 'Tournament bracket not found'
      });
    }

    if (bracket.status !== 'generated') {
      return res.status(400).json({
        success: false,
        message: 'Bracket must be in generated status to seed'
      });
    }

    // Get first round matches
    const firstRoundMatches = bracket.nodes.filter(node => 
      node.round === bracket.currentRound
    );

    // Apply seeding if provided
    if (seedOrder && seedOrder.length > 0) {
      // Reorder players based on seeding
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        if (i * 2 < seedOrder.length) {
          match.player1 = seedOrder[i * 2];
        }
        if (i * 2 + 1 < seedOrder.length) {
          match.player2 = seedOrder[i * 2 + 1];
        }
      }
    }

    bracket.isSeeded = true;
    bracket.status = 'active';
    await bracket.save();

    // Update tournament status
    await Tournament.findByIdAndUpdate(bracket.tournament, { status: 'active' });

    res.status(200).json({
      success: true,
      message: 'Tournament bracket seeded successfully',
      data: {
        bracketId: bracket._id,
        status: bracket.status,
        isSeeded: bracket.isSeeded
      }
    });

  } catch (error) {
    console.error('Error seeding tournament bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get tournament bracket
const getTournamentBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const bracket = await TournamentBracket.findOne({ tournament: tournamentId })
      .populate('nodes.player1', 'name email')
      .populate('nodes.player2', 'name email')
      .populate('nodes.winner', 'name email')
      .populate('nodes.matchId');

    if (!bracket) {
      return res.status(404).json({
        success: false,
        message: 'Tournament bracket not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bracket
    });

  } catch (error) {
    console.error('Error getting tournament bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update match result and advance bracket
const updateMatchResult = async (req, res) => {
  try {
    const { bracketId, nodeId } = req.params;
    const { winnerId, player1Score, player2Score, sets } = req.body;

    const bracket = await TournamentBracket.findById(bracketId);
    if (!bracket) {
      return res.status(404).json({
        success: false,
        message: 'Tournament bracket not found'
      });
    }

    const node = bracket.nodes.id(nodeId);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Match node not found'
      });
    }

    // Update node with winner
    node.winner = winnerId;
    node.status = 'completed';

    // Create or update match record
    if (!node.matchId) {
      const match = new Match({
        tournament: bracket.tournament,
        player1: node.player1,
        player2: node.player2,
        round: node.round,
        matchNumber: node.matchNumber,
        status: 'completed',
        scheduledTime: new Date(),
        winner: winnerId,
        loser: winnerId.equals(node.player1) ? node.player2 : node.player1
      });

      if (sets && sets.length > 0) {
        match.sets = sets;
      }

      await match.save();
      node.matchId = match._id;
    }

    // Advance winner to next round
    const nextRound = bracket.getNextRoundMatches(node.round);
    if (nextRound) {
      const nextRoundMatches = bracket.nodes.filter(n => n.round === nextRound);
      const matchIndex = Math.floor(node.position.x / 2);
      
      if (matchIndex < nextRoundMatches.length) {
        const nextMatch = nextRoundMatches[matchIndex];
        
        // Determine which position (player1 or player2) to fill
        if (node.position.x % 2 === 0) {
          nextMatch.player1 = winnerId;
        } else {
          nextMatch.player2 = winnerId;
        }
        
        nextMatch.status = 'pending';
      }
    }

    await bracket.save();

    // Check if current round is complete
    if (bracket.isRoundComplete(bracket.currentRound)) {
      const nextRound = bracket.getNextRoundMatches(bracket.currentRound);
      if (nextRound) {
        bracket.currentRound = nextRound;
        await bracket.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Match result updated successfully',
      data: {
        nodeId: node._id,
        winner: winnerId,
        nextRound: bracket.currentRound
      }
    });

  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bracket statistics
const getBracketStats = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const bracket = await TournamentBracket.findOne({ tournament: tournamentId });
    if (!bracket) {
      return res.status(404).json({
        success: false,
        message: 'Tournament bracket not found'
      });
    }

    const stats = {
      totalMatches: bracket.nodes.length,
      completedMatches: bracket.nodes.filter(n => n.status === 'completed').length,
      pendingMatches: bracket.nodes.filter(n => n.status === 'pending').length,
      currentRound: bracket.currentRound,
      totalRounds: bracket.totalRounds,
      isSeeded: bracket.isSeeded,
      status: bracket.status
    };

    // Add round-specific stats
    const roundStats = {};
    const rounds = ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    
    rounds.forEach(round => {
      const roundMatches = bracket.nodes.filter(n => n.round === round);
      if (roundMatches.length > 0) {
        roundStats[round] = {
          total: roundMatches.length,
          completed: roundMatches.filter(n => n.status === 'completed').length,
          pending: roundMatches.filter(n => n.status === 'pending').length
        };
      }
    });

    stats.roundStats = roundStats;

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting bracket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  generateTournamentBracket,
  seedTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  getBracketStats
}; 