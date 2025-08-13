// Test script for episode unlock functionality
const fetch = require('node-fetch');

async function testUnlockEpisode() {
  // You'll need to replace this with a valid token from a logged-in user
  const token = 'YOUR_FIREBASE_ID_TOKEN_HERE'; // Get this from browser console after logging in
  const apiUrl = 'https://www.fabletech.studio/api/customer/unlock-episode';
  
  // Test data
  const testData = {
    seriesId: 'test-series-id', // Replace with actual series ID
    episodeNumber: 2,
    creditCost: 30
  };
  
  try {
    console.log('Testing episode unlock...');
    console.log('Request data:', testData);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Episode unlock successful!');
    } else {
      console.log('❌ Episode unlock failed:', data.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Instructions for getting the token:
console.log(`
To test episode unlock:
1. Open https://www.fabletech.studio in your browser
2. Log in as a customer
3. Open browser console (F12)
4. Run: localStorage.getItem('customerToken')
5. Copy the token and replace YOUR_FIREBASE_ID_TOKEN_HERE above
6. Replace test-series-id with an actual series ID from your database
7. Run: node test-unlock-episode.js
`);

// Uncomment to run the test
// testUnlockEpisode();