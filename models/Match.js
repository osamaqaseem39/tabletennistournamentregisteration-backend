const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  player1Score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be negative'],
    max: [11, 'Score cannot exceed 11']
  },
  player2Score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be negative'],
    max: [11, 'Score cannot exceed 11']
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', 'draw'],
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  sets: [setSchema],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isWalkover: {
    type: Boolean,
    default: false
  },
  walkoverReason: {
    type: String,
    trim: true
  },
  referee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { timestamps: true });

// Virtual for match format based on round
matchSchema.virtual('matchFormat').get(function() {
  switch (this.round) {
    case 'round_of_32':
    case 'round_of_16':
      return '1 set knockout';
    case 'quarter_finals':
      return 'Best of 3 sets';
    case 'semi_finals':
      return 'Best of 5 sets';
    case 'final':
      return 'Best of 7 sets';
    default:
      return '1 set knockout';
  }
});

// Virtual for required sets to win
matchSchema.virtual('setsToWin').get(function() {
  switch (this.round) {
    case 'round_of_32':
    case 'round_of_16':
      return 1;
    case 'quarter_finals':
      return 2;
    case 'semi_finals':
      return 3;
    case 'final':
      return 4;
    default:
      return 1;
  }
});

// Virtual for checking if match is completed
matchSchema.virtual('isCompleted').get(function() {
  if (this.status === 'completed') return true;
  
  const player1Wins = this.sets.filter(set => set.winner === 'player1').length;
  const player2Wins = this.sets.filter(set => set.winner === 'player2').length;
  const requiredSets = this.setsToWin;
  
  return player1Wins >= requiredSets || player2Wins >= requiredSets;
});

// Method to add set result
matchSchema.methods.addSetResult = function(player1Score, player2Score) {
  if (this.status === 'completed') {
    throw new Error('Match is already completed');
  }
  
  if (this.status === 'cancelled') {
    throw new Error('Match is cancelled');
  }
  
  // Validate scores
  if (player1Score < 0 || player1Score > 11 || player2Score < 0 || player2Score > 11) {
    throw new Error('Invalid scores. Scores must be between 0 and 11');
  }
  
  // Determine winner of the set
  let winner;
  if (player1Score > player2Score) {
    winner = 'player1';
  } else if (player2Score > player1Score) {
    winner = 'player2';
  } else {
    winner = 'draw';
  }
  
  const newSet = {
    player1Score,
    player2Score,
    winner,
    isCompleted: true
  };
  
  this.sets.push(newSet);
  this.status = 'in_progress';
  
  // Check if match is completed
  const player1Wins = this.sets.filter(set => set.winner === 'player1').length;
  const player2Wins = this.sets.filter(set => set.winner === 'player2').length;
  const requiredSets = this.setsToWin;
  
  if (player1Wins >= requiredSets || player2Wins >= requiredSets) {
    this.status = 'completed';
    this.winner = player1Wins >= requiredSets ? this.player1 : this.player2;
    this.loser = player1Wins >= requiredSets ? this.player2 : this.player1;
  }
  
  return this.save();
};

// Method to determine next match
matchSchema.methods.getNextMatch = function() {
  // This would be implemented based on tournament bracket logic
  // For now, return null
  return null;
};

module.exports = mongoose.model('Match', matchSchema); 