#!/usr/bin/env node

/**
 * Test script to debug longitude undefined issue
 * Tests a single chart from your Batch #3 data
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001'; // Default backend port

// Test data from your Batch #3 - Dalai Lama XIV
const testChart = {
  name: "Dalai Lama XIV",
  date: "1935-07-06", // DD-MM-YYYY to YYYY-MM-DD format
  time: "04:38",
  latitude: 29.0,
  longitude: 91.0,
  timezone: "Asia/Kathmandu",
  place: "Lhasa, Tibet"
};

async function testKundliAPI() {
  try {
    console.log('🧪 TESTING KUNDLI API');
    console.log('📊 Test Data:', JSON.stringify(testChart, null, 2));
    
    const response = await axios.post(`${API_BASE}/api/kundli`, testChart, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ SUCCESS! Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API ERROR');
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ NETWORK ERROR');
      console.log('No response received. Is the server running on port 3002?');
      console.log('Error:', error.message);
    } else {
      console.log('❌ REQUEST ERROR');
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testKundliAPI();
