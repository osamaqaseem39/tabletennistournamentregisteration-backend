const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      referralCode,
      paymentMethod
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if referral code exists and is valid
    let referredBy = null;
    let referralDiscount = 0;
    let totalDiscount = 0;
    let finalAmount = 1500; // Base registration fee in Rs

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }
      
      // Check if referrer has enough referrals to give discount
      if (referrer.referralCount < 30) {
        return res.status(400).json({
          success: false,
          message: 'Referrer needs at least 30 referrals to provide discount'
        });
      }
      
      referredBy = referrer._id;
      referralDiscount = 50; // 50 Rs discount per referral
      totalDiscount = referralDiscount;
      finalAmount = finalAmount - totalDiscount;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      referralCode: referralCode,
      referredBy,
      referralDiscount,
      totalDiscount,
      finalAmount,
      paymentMethod
    });

    // Generate referral code for the new user
    user.referralCode = user.generateReferralCode();
    await user.save();

    // Update referrer's referral count if applicable
    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, {
        $inc: { referralCount: 1 }
      });

      // Check if referrer is now eligible for cashback
      const referrer = await User.findById(referredBy);
      if (referrer.referralCount >= 3 && !referrer.cashbackEligible) {
        referrer.cashbackEligible = true;
        // Calculate cashback based on referral count
        let cashbackAmount = 0;
        if (referrer.referralCount >= 30) {
          cashbackAmount = 1500; // Maximum cashback
        } else if (referrer.referralCount >= 3) {
          // Linear scaling from 3 referrals (PKR 150) to 30 referrals (PKR 1500)
          // Formula: 150 + (referralCount - 3) * (1500 - 150) / (30 - 3)
          cashbackAmount = 150 + Math.round((referrer.referralCount - 3) * (1500 - 150) / 27);
        }
        referrer.cashbackAmount = cashbackAmount;
        await referrer.save();
      }
    }

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          registrationId: user.registrationId,
          referralCode: user.referralCode,
          referralDiscount: user.referralDiscount,
          totalDiscount: user.totalDiscount,
          finalAmount: user.finalAmount,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Authenticate user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationId: user.registrationId,
        referralCode: user.referralCode,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;

      const updatedUser = await user.save();
      res.json({
        success: true,
        data: updatedUser
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload payment proof
// @route   POST /api/users/payment-proof
// @access  Private
const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.paymentProof = req.file.path;
    user.paymentStatus = 'completed';
    await user.save();

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        paymentProof: user.paymentProof,
        paymentStatus: user.paymentStatus
      }
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { registrationStatus, paymentStatus } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (registrationStatus) user.registrationStatus = registrationStatus;
    if (paymentStatus) user.paymentStatus = paymentStatus;

    const updatedUser = await user.save();
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate referral code and get discount info
// @route   POST /api/users/validate-referral
// @access  Public
const validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Check if referrer has enough referrals to provide discount
    if (referrer.referralCount < 3) {
      return res.status(400).json({
        success: false,
        message: 'Referrer needs at least 3 referrals to provide discount',
        data: {
          isValid: false,
          referralCount: referrer.referralCount,
          requiredReferrals: 3,
          discount: 0,
          finalAmount: 1500
        }
      });
    }

    // Calculate discount
    const discount = 50; // 50 Rs discount
    const finalAmount = 1500 - discount;

    res.json({
      success: true,
      message: 'Valid referral code',
      data: {
        isValid: true,
        referrerName: `${referrer.firstName} ${referrer.lastName}`,
        referralCount: referrer.referralCount,
        discount: discount,
        finalAmount: finalAmount,
        originalAmount: 1500
      }
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during referral validation'
    });
  }
};

// @desc    Get referral statistics for a user
// @route   GET /api/users/referral-stats
// @access  Private
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get users referred by this user
    const referredUsers = await User.find({ referredBy: user._id })
      .select('firstName lastName email registrationStatus paymentStatus createdAt');

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        cashbackEligible: user.cashbackEligible,
        cashbackAmount: user.cashbackAmount,
        referredUsers: referredUsers
      }
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadPaymentProof,
  getUsers,
  updateUserStatus,
  validateReferralCode,
  getReferralStats
}; 