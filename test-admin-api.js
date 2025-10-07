// Test script for admin API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const adminToken = 'admin_test_token_' + Date.now();

async function testAdminAPIs() {
    console.log('🧪 Testing Admin API Endpoints...\n');
    
    try {
        // Test 1: Get Admin Stats
        console.log('📊 Testing /api/admin/stats');
        const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
            headers: { 'AdminToken': adminToken }
        });
        console.log('✅ Stats Response:', statsResponse.data);
        console.log('');
        
        // Test 2: Get Recent Activities
        console.log('📈 Testing /api/admin/recent-activity');
        const activityResponse = await axios.get(`${BASE_URL}/api/admin/recent-activity`, {
            headers: { 'AdminToken': adminToken }
        });
        console.log('✅ Activities Response:', activityResponse.data);
        console.log('');
        
        // Test 3: Get All Users
        console.log('👥 Testing /api/admin/users');
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: { 'AdminToken': adminToken }
        });
        console.log('✅ Users Response:', usersResponse.data);
        console.log('');
        
        // Test 4: Get Expert Applications
        console.log('🎓 Testing /api/admin/expert-applications');
        const expertsResponse = await axios.get(`${BASE_URL}/api/admin/expert-applications`, {
            headers: { 'AdminToken': adminToken }
        });
        console.log('✅ Expert Applications Response:', expertsResponse.data);
        
        console.log('\n🎉 All API tests completed successfully!');
        
    } catch (error) {
        console.error('❌ API Test Error:', error.response?.data || error.message);
    }
}

// Run the tests
testAdminAPIs();