const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [16, 'Minimum 16 participants required'],
    max: [128, 'Maximum 128 participants allowed']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['registration', 'seeding', 'active', 'completed', 'cancelled'],
    default: 'registration'
  },
  matchRules: {
    roundOf16AndEarlier: {
      type: String,
      default: '1 set knockout',
      enum: ['1 set knockout']
    },
    quarterFinals: {
      type: String,
      default: 'Best of 3 sets',
      enum: ['Best of 3 sets']
    },
    semiFinals: {
      type: String,
      default: 'Best of 5 sets',
      enum: ['Best of 5 sets']
    },
    final: {
      type: String,
      default: 'Best of 7 sets',
      enum: ['Best of 7 sets']
    }
  },
  entryFee: {
    type: Number,
    required: [true, 'Entry fee is required'],
    min: [0, 'Entry fee cannot be negative'],
    default: 1500
  },
  prizePool: {
    first: { type: Number, default: 0 },
    second: { type: Number, default: 0 },
    third: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Virtual for checking if tournament is full
tournamentSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for checking if registration is open
tournamentSchema.virtual('isRegistrationOpen').get(function() {
  return new Date() < this.registrationDeadline && this.status === 'registration';
});

// Method to add participant
tournamentSchema.methods.addParticipant = function() {
  if (this.currentParticipants < this.maxParticipants) {
    this.currentParticipants += 1;
    return this.save();
  }
  throw new Error('Tournament is full');
};

// Method to remove participant
tournamentSchema.methods.removeParticipant = function() {
  if (this.currentParticipants > 0) {
    this.currentParticipants -= 1;
    return this.save();
  }
  throw new Error('No participants to remove');
};

module.exports = mongoose.model('Tournament', tournamentSchema); 