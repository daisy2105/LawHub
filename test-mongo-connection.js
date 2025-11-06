const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 URI (partial):', MONGODB_URI.substring(0, 20) + '...');

async function testConnection() {
  try {
    console.log('🔄 Attempting connection with extended timeout...');
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB Connection Successful!');
    
    // Test a simple operation
    const adminDB = mongoose.connection.db.admin();
    const result = await adminDB.ping();
    console.log('✅ MongoDB Ping Successful:', result);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('❌ Error Code:', error.code);
    
    if (error.message.includes('EREFUSED')) {
      console.log('\n🔧 DNS Resolution Issue - Troubleshooting:');
      console.log('   1. Check internet connection');
      console.log('   2. Try using Google DNS (8.8.8.8, 8.8.4.4)');
      console.log('   3. Check Windows Firewall settings');
      console.log('   4. Verify MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  }
}

testConnection();