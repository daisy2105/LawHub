// MongoDB Connection Tester
require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoConnection(uri) {
  console.log('🔗 Testing MongoDB Connection...');
  console.log('URI:', uri?.replace(/:[^:]*@/, ':****@')); // Hide password
  
  try {
    // Test with shorter timeout
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // 15 seconds
      connectTimeoutMS: 15000,
    });
    
    console.log('✅ Connection successful!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const adminResult = await db.admin().ping();
    console.log('✅ Database ping successful:', adminResult);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Test a simple query
    const users = await db.collection('users').countDocuments();
    console.log('👥 Users in database:', users);
    
    console.log('\n🎉 MongoDB is working perfectly!');
    return true;
    
  } catch (error) {
    console.log('\n❌ Connection failed!');
    console.log('Error type:', error.name);
    console.log('Error message:', error.message);
    
    // Provide specific solutions based on error type
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 DNS Resolution Issue - Possible Solutions:');
      console.log('1. Check if MongoDB Atlas cluster is RUNNING (not paused)');
      console.log('2. Verify the cluster URL is correct');
      console.log('3. Check your internet connection');
      console.log('4. Try using a different network (mobile hotspot)');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 Authentication Issue - Possible Solutions:');
      console.log('1. Verify username and password are correct');
      console.log('2. Check if user has proper database permissions');
      console.log('3. Try creating a new database user');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Timeout Issue - Possible Solutions:');
      console.log('1. Check Network Access settings in MongoDB Atlas');
      console.log('2. Add 0.0.0.0/0 to IP whitelist');
      console.log('3. Check firewall settings');
    }
    
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

// Test current connection
console.log('Testing current MongoDB URI from .env file...\n');
testMongoConnection(process.env.MONGODB_URI)
  .then(success => {
    if (!success) {
      console.log('\n💡 To fix this:');
      console.log('1. Go to https://cloud.mongodb.com/');
      console.log('2. Make sure your cluster is RUNNING');
      console.log('3. Go to Network Access → Add IP Address → 0.0.0.0/0');
      console.log('4. Get a fresh connection string from Connect → Connect your application');
      console.log('5. Update the MONGODB_URI in your .env file');
    }
  })
  .catch(console.error);