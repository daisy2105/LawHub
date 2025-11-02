const http = require('http');

console.log('🔍 Testing backend server connection...\n');

// Test 1: Health endpoint
const testHealth = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/health',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('✅ Health Check:');
                console.log('   Status:', res.statusCode);
                console.log('   Response:', data);
                console.log('');
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('❌ Health Check Failed:', e.message);
            reject(e);
        });

        req.end();
    });
};

// Test 2: Login endpoint (with test credentials)
const testLogin = () => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'byrosebegum@gmail.com',
            password: 'test123'
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('✅ Login Endpoint Test:');
                console.log('   Status:', res.statusCode);
                console.log('   Response:', data);
                console.log('');
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('❌ Login Test Failed:', e.message);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
};

// Run tests
(async () => {
    try {
        await testHealth();
        await testLogin();
        console.log('✅ All connection tests completed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Open login2.html in Live Server (port 5501)');
        console.log('   2. Try logging in with your credentials');
        console.log('   3. The frontend will now call http://localhost:5000/api/*');
    } catch (error) {
        console.log('❌ Tests failed');
    }
})();
