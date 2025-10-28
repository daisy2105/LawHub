// Test script to check experts API
const http = require('http');

async function testExpertsAPI() {
    try {
        console.log('🧪 Testing experts API...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/experts',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log('✅ API Response:', JSON.stringify(jsonData, null, 2));
                        
                        if (jsonData.experts && jsonData.experts.length > 0) {
                            console.log(`🎉 Found ${jsonData.experts.length} experts!`);
                            jsonData.experts.forEach((expert, index) => {
                                console.log(`Expert ${index + 1}:`);
                                console.log(`  - ID: ${expert.id}`);
                                console.log(`  - Name: ${expert.name}`);
                                console.log(`  - Email: ${expert.email}`);
                                console.log(`  - Specialization: ${expert.specialization}`);
                                console.log(`  - Experience: ${expert.experience} years`);
                                console.log(`  - Location: ${expert.location}`);
                            });
                        } else {
                            console.log('⚠️ No experts found in response');
                        }
                    } else {
                        console.log('❌ API request failed');
                        console.log('Error response:', data);
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse response:', parseError.message);
                    console.log('Raw response:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request failed:', error.message);
        });

        req.end();
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testExpertsAPI();