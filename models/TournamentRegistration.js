const mongoose = require('mongoose');

const tournamentRegistrationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank'],
    required: true
  },
  paymentProof: {
    type: String,
    default: null
  },
  entryFee: {
    type: Number,
    required: true,
    default: 1500
  },
  seed: {
    type: Number,
    default: null,
    min: [1, 'Seed must be at least 1']
  },
  group: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to ensure one registration per player per tournament
tournamentRegistrationSchema.index({ tournament: 1, player: 1 }, { unique: true });

// Virtual for checking if registration is active
tournamentRegistrationSchema.virtual('isRegistrationActive').get(function() {
  return this.status === 'approved' && this.paymentStatus === 'completed' && this.isActive;
});

// Method to approve registration
tournamentRegistrationSchema.methods.approve = function(adminUserId) {
  if (this.status !== 'pending') {
    throw new Error('Registration is not pending');
  }
  
  if (this.paymentStatus !== 'completed') {
    throw new Error('Payment not completed');
  }
  
  this.status = 'approved';
  this.approvedBy = adminUserId;
  this.approvedAt = new Date();
  
  return this.save();
};

// Method to reject registration
tournamentRegistrationSchema.methods.reject = function(adminUserId, reason) {
  if (this.status !== 'pending') {
    throw new Error('Registration is not pending');
  }
  
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.approvedBy = adminUserId;
  this.approvedAt = new Date();
  
  return this.save();
};

// Method to withdraw registration
tournamentRegistrationSchema.methods.withdraw = function() {
  if (this.status === 'completed') {
    throw new Error('Cannot withdraw from completed tournament');
  }
  
  this.status = 'withdrawn';
  this.isActive = false;
  
  return this.save();
};

// Static method to get approved registrations for a tournament
tournamentRegistrationSchema.statics.getApprovedRegistrations = function(tournamentId) {
  return this.find({
    tournament: tournamentId,
    status: 'approved',
    paymentStatus: 'completed',
    isActive: true
  }).populate('player', 'firstName lastName email phone');
};

// Static method to get pending registrations for a tournament
tournamentRegistrationSchema.statics.getPendingRegistrations = function(tournamentId) {
  return this.find({
    tournament: tournamentId,
    status: 'pending'
  }).populate('player', 'firstName lastName email phone');
};

module.exports = mongoose.model('TournamentRegistration', tournamentRegistrationSchema); 