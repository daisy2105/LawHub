/**
 * Chat System Test Script
 * Run this to verify your chat system setup
 * 
 * Usage: node test-chat-system.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testServerRunning() {
    log('\n🔍 Testing if server is running...', 'blue');
    try {
        const result = await makeRequest('GET', '/api/health');
        if (result.status === 200 || result.status === 404) {
            log('✅ Server is running on port 3000', 'green');
            return true;
        }
    } catch (error) {
        log('❌ Server is not running. Start it with: node server.js', 'red');
        return false;
    }
}

async function testChatEndpoints() {
    log('\n🔍 Testing chat endpoints availability...', 'blue');
    
    const endpoints = [
        { method: 'POST', path: '/api/chat/request-connection', name: 'Request Connection' },
        { method: 'GET', path: '/api/chat/pending-requests', name: 'Pending Requests' },
        { method: 'GET', path: '/api/chat/connections', name: 'Get Connections' },
        { method: 'POST', path: '/api/chat/send-message', name: 'Send Message' },
        { method: 'GET', path: '/api/chat/unread-count', name: 'Unread Count' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest(endpoint.method, endpoint.path);
            // We expect 401 (unauthorized) if endpoints exist but no token
            if (result.status === 401) {
                log(`✅ ${endpoint.name}: Endpoint exists (authentication required)`, 'green');
            } else if (result.status === 404) {
                log(`❌ ${endpoint.name}: Endpoint not found`, 'red');
            } else {
                log(`⚠️  ${endpoint.name}: Unexpected status ${result.status}`, 'yellow');
            }
        } catch (error) {
            log(`❌ ${endpoint.name}: Error - ${error.message}`, 'red');
        }
    }
}

async function testEncryption() {
    log('\n🔍 Testing encryption module...', 'blue');
    
    try {
        const crypto = require('crypto');
        const encryptionKey = process.env.CHAT_ENCRYPTION_KEY || 'test-key-32-characters-long!!!';
        
        if (encryptionKey.length !== 32) {
            log('⚠️  CHAT_ENCRYPTION_KEY is not 32 characters. Using test key.', 'yellow');
        }
        
        // Test encryption
        const testMessage = 'Hello, this is a test message!';
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(encryptionKey, 'utf-8');
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(testMessage, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        
        // Test decryption
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        if (decrypted === testMessage) {
            log('✅ Encryption/Decryption working correctly', 'green');
        } else {
            log('❌ Encryption/Decryption failed', 'red');
        }
    } catch (error) {
        log(`❌ Encryption test failed: ${error.message}`, 'red');
    }
}

async function testDatabaseSchema() {
    log('\n🔍 Checking database schema...', 'blue');
    log('⚠️  Manual verification required:', 'yellow');
    log('   1. Go to Supabase Dashboard → Table Editor', 'gray');
    log('   2. Check if these tables exist:', 'gray');
    log('      - chat_connections', 'gray');
    log('      - chat_messages', 'gray');
    log('   3. If not, run the SQL from database-chat-schema.sql', 'gray');
}

async function testEnvironmentVariables() {
    log('\n🔍 Checking environment variables...', 'blue');
    
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_KEY',
        'CHAT_ENCRYPTION_KEY'
    ];
    
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            if (varName === 'CHAT_ENCRYPTION_KEY' && process.env[varName].length !== 32) {
                log(`⚠️  ${varName}: Set but not 32 characters (${process.env[varName].length} chars)`, 'yellow');
            } else {
                log(`✅ ${varName}: Set`, 'green');
            }
        } else {
            log(`❌ ${varName}: Not set`, 'red');
        }
    }
}

async function runAllTests() {
    log('='.repeat(60), 'blue');
    log('           CHAT SYSTEM TEST SUITE', 'blue');
    log('='.repeat(60), 'blue');
    
    // Load environment variables
    try {
        require('dotenv').config();
        log('✅ Environment variables loaded', 'green');
    } catch (error) {
        log('⚠️  Could not load .env file', 'yellow');
    }
    
    await testEnvironmentVariables();
    
    const serverRunning = await testServerRunning();
    
    if (serverRunning) {
        await testChatEndpoints();
    }
    
    await testEncryption();
    await testDatabaseSchema();
    
    log('\n' + '='.repeat(60), 'blue');
    log('                  TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    log('\nNext steps:', 'yellow');
    log('1. If server is not running: node server.js', 'gray');
    log('2. If database tables missing: Run database-chat-schema.sql in Supabase', 'gray');
    log('3. If env vars missing: Add them to .env file', 'gray');
    log('4. Open modern-dashboard.html and test the chat flow', 'gray');
    log('\nFor detailed setup: See CHAT_SETUP.md\n', 'blue');
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
});
