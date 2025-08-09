const fetch = require('node-fetch');

async function testCORS() {
  const baseUrl = 'https://tt-server-red.vercel.app';
  
  console.log('Testing CORS configuration...\n');
  
  // Test 1: Simple GET request
  try {
    console.log('1. Testing GET /api/health...');
    const response = await fetch(`${baseUrl}/api/health`);
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('  Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
    console.log('✅ GET request successful\n');
  } catch (error) {
    console.log('❌ GET request failed:', error.message, '\n');
  }
  
  // Test 2: OPTIONS preflight request
  try {
    console.log('2. Testing OPTIONS preflight...');
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://tabletennistournamentregisteration.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('  Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
    console.log('✅ OPTIONS preflight successful\n');
  } catch (error) {
    console.log('❌ OPTIONS preflight failed:', error.message, '\n');
  }
  
  // Test 3: POST request with CORS headers
  try {
    console.log('3. Testing POST with CORS...');
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: {
        'Origin': 'https://tabletennistournamentregisteration.vercel.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        address: 'Test Address',
        dateOfBirth: '1990-01-01',
        paymentMethod: 'bank'
      })
    });
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('  Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
    console.log('✅ POST request successful\n');
  } catch (error) {
    console.log('❌ POST request failed:', error.message, '\n');
  }
}

testCORS().catch(console.error); 