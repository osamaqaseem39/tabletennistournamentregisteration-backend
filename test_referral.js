const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tabletennis')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function testReferralSystem() {
  try {
    console.log('🧪 Testing Referral System...\n');

    // Clear existing test users
    await User.deleteMany({ email: { $regex: /^test/ } });
    console.log('✅ Cleared test users\n');

    // Create first user (referrer)
    const user1 = await User.create({
      email: 'test1@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      address: '123 Test St',
      dateOfBirth: '1990-01-01',
      paymentMethod: 'card'
    });
    console.log('✅ Created User 1 (Referrer):', user1.email);
    console.log('   Referral Code:', user1.referralCode);
    console.log('   Referral Count:', user1.referralCount);
    console.log('   Cashback Eligible:', user1.cashbackEligible);
    console.log('   Cashback Amount:', user1.cashbackAmount);
    console.log('');

    // Create 4 more users with user1's referral code
    for (let i = 2; i <= 5; i++) {
      const user = await User.create({
        email: `test${i}@example.com`,
        password: 'password123',
        firstName: `User${i}`,
        lastName: 'Test',
        phone: `123456789${i}`,
        address: `${i}23 Test St`,
        dateOfBirth: '1990-01-01',
        referralCode: user1.referralCode,
        referredBy: user1._id,
        paymentMethod: 'card'
      });

      // Update referrer's referral count
      await User.findByIdAndUpdate(user1._id, {
        $inc: { referralCount: 1 }
      });

      console.log(`✅ Created User ${i} with referral code:`, user.email);
      console.log(`   Final Amount: PKR ${user.finalAmount}`);
      console.log(`   Referral Discount: PKR ${user.referralDiscount}`);
      console.log('');
    }

    // Check referrer status after 5 referrals
    const updatedUser1 = await User.findById(user1._id);
    console.log('📊 Referrer Status After 5 Referrals:');
    console.log('   Referral Count:', updatedUser1.referralCount);
    console.log('   Cashback Eligible:', updatedUser1.cashbackEligible);
    console.log('   Cashback Amount:', updatedUser1.cashbackAmount);
    console.log('');

    // Test 6th referral (should get discount)
    const user6 = await User.create({
      email: 'test6@example.com',
      password: 'password123',
      firstName: 'User6',
      lastName: 'Test',
      phone: '1234567896',
      address: '623 Test St',
      dateOfBirth: '1990-01-01',
      referralCode: user1.referralCode,
      referredBy: user1._id,
      paymentMethod: 'card'
    });

    // Update referrer's referral count
    await User.findByIdAndUpdate(user1._id, {
      $inc: { referralCount: 1 }
    });

    console.log('✅ Created User 6 with referral code:');
    console.log('   Final Amount: PKR ', user6.finalAmount);
    console.log('   Referral Discount: PKR ', user6.referralDiscount);
    console.log('');

    // Final referrer status
    const finalUser1 = await User.findById(user1._id);
    console.log('📊 Final Referrer Status:');
    console.log('   Referral Count:', finalUser1.referralCount);
    console.log('   Cashback Eligible:', finalUser1.cashbackEligible);
    console.log('   Cashback Amount:', finalUser1.cashbackAmount);
    console.log('');

    console.log('🎉 Referral System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testReferralSystem(); 