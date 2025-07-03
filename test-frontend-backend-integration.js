// Simple test to verify frontend API service reaches backend API
const axios = require('axios');

(async () => {
  try {
    console.log('🔗 Testing frontend-backend API connection...\n');

    const response = await axios.post('http://localhost:3001/api/kundli', {
      date: '1990-01-15',
      time: '10:30',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
      name: 'Test User',
      place: 'New Delhi'
    });

    if (response.data && response.data.success) {
      console.log('✅ Frontend API service can successfully connect to backend!');
      console.log('User Name:', response.data.data.birthDetails.name);
      console.log('Ascendant Sign:', response.data.data.chartSummary.ascendant.sign);
      console.log('Moon Sign:', response.data.data.chartSummary.moonSign.sign);
      console.log('🌟 Integration working end-to-end!');
    } else {
      console.log('❌ Failed to get a successful response:', response.data);
    }
  } catch (error) {
    console.error('❌ Frontend-backend API connection failed:', error);
  }
})();
