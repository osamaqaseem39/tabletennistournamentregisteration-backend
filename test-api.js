const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  address: '123 Test Street, Test City, TC 12345',
  dateOfBirth: '1990-01-01',
  paymentMethod: 'card'
};

async function testAPI() {
  console.log('🧪 Testing Table Tennis Tournament API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test user registration
    console.log('\n2. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/users/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.data.email);
    
    const { token } = registerResponse.data.data;

    // Test user login
    console.log('\n3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.data.email);

    // Test getting user profile (protected route)
    console.log('\n4. Testing protected route (profile)...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.data.firstName);

    console.log('\n🎉 All tests passed! API is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log('- Health endpoint: ✅');
    console.log('- User registration: ✅');
    console.log('- User login: ✅');
    console.log('- Protected route access: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Make sure MongoDB is running and the server is started.');
      console.log('   Run: npm run dev');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI; 