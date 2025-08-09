const mongoose = require('mongoose');

const bracketNodeSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  round: {
    type: String,
    required: true,
    enum: [
      'round_of_32', 'round_of_16', 'quarter_finals', 
      'semi_finals', 'final', 'third_place'
    ]
  },
  matchNumber: {
    type: Number,
    required: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  nextMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentBracket',
    default: null
  },
  isBye: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

const tournamentBracketSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    unique: true
  },
  nodes: [bracketNodeSchema],
  status: {
    type: String,
    enum: ['generating', 'generated', 'active', 'completed'],
    default: 'generating'
  },
  totalRounds: {
    type: Number,
    required: true
  },
  currentRound: {
    type: String,
    default: 'round_of_32'
  },
  isSeeded: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to get all matches for a specific round
tournamentBracketSchema.methods.getMatchesByRound = function(round) {
  return this.nodes.filter(node => node.round === round);
};

// Method to get next round matches
tournamentBracketSchema.methods.getNextRoundMatches = function(currentRound) {
  const roundOrder = [
    'round_of_32', 'round_of_16', 'quarter_finals', 
    'semi_finals', 'final', 'third_place'
  ];
  const currentIndex = roundOrder.indexOf(currentRound);
  if (currentIndex < roundOrder.length - 1) {
    return roundOrder[currentIndex + 1];
  }
  return null;
};

// Method to check if round is complete
tournamentBracketSchema.methods.isRoundComplete = function(round) {
  const roundMatches = this.getMatchesByRound(round);
  return roundMatches.every(match => match.status === 'completed');
};

// Method to advance to next round
tournamentBracketSchema.methods.advanceToNextRound = function() {
  const roundOrder = [
    'round_of_32', 'round_of_16', 'quarter_finals', 
    'semi_finals', 'final', 'third_place'
  ];
  const currentIndex = roundOrder.indexOf(this.currentRound);
  if (currentIndex < roundOrder.length - 1) {
    this.currentRound = roundOrder[currentIndex + 1];
    return this.save();
  }
  return null;
};

module.exports = mongoose.model('TournamentBracket', tournamentBracketSchema); 