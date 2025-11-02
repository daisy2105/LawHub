/**
 * Test Script for Expert Chat Requests
 * 
 * This script tests the expert chat request endpoints
 */

const mongoose = require('mongoose');
const ChatRequest = require('./models/ChatRequest');
const User = require('./models/User');
const ExpertApplication = require('./models/ExpertApplication');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lawhub';

async function testExpertRequests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Find all approved experts
    console.log('1️⃣ Finding approved experts...');
    const approvedExperts = await ExpertApplication.find({ status: 'approved' });
    console.log(`   Found ${approvedExperts.length} approved experts`);
    
    if (approvedExperts.length > 0) {
      const expert = approvedExperts[0];
      console.log(`   Expert: ${expert.userName} (${expert.userEmail})`);
      console.log(`   User ID: ${expert.userId}`);
      
      // 2. Find pending requests for this expert
      console.log('\n2️⃣ Finding pending requests for expert...');
      const pendingRequests = await ChatRequest.find({
        expertId: expert.userId,
        status: 'pending'
      });
      
      console.log(`   Found ${pendingRequests.length} pending requests`);
      
      if (pendingRequests.length > 0) {
        console.log('\n   Pending Requests:');
        for (const req of pendingRequests) {
          const user = await User.findById(req.userId);
          console.log(`   - From: ${user?.name || 'Unknown'} (${user?.email || 'N/A'})`);
          console.log(`     Message: ${req.message || 'No message'}`);
          console.log(`     Created: ${req.createdAt}`);
        }
      } else {
        console.log('   ℹ️ No pending requests found');
        
        // 3. Show all requests for this expert
        console.log('\n3️⃣ Checking all requests (any status)...');
        const allRequests = await ChatRequest.find({
          expertId: expert.userId
        });
        console.log(`   Total requests: ${allRequests.length}`);
        
        if (allRequests.length > 0) {
          console.log('\n   All Requests:');
          for (const req of allRequests) {
            const user = await User.findById(req.userId);
            console.log(`   - Status: ${req.status}`);
            console.log(`     From: ${user?.name || 'Unknown'} (${user?.email || 'N/A'})`);
            console.log(`     Created: ${req.createdAt}`);
          }
        }
      }
      
      // 4. Find all chat requests in database
      console.log('\n4️⃣ All chat requests in database:');
      const allChatRequests = await ChatRequest.find({});
      console.log(`   Total chat requests: ${allChatRequests.length}`);
      
      if (allChatRequests.length > 0) {
        for (const req of allChatRequests) {
          const user = await User.findById(req.userId);
          const expertUser = await User.findById(req.expertId);
          console.log(`\n   Request ID: ${req._id}`);
          console.log(`   From: ${user?.name || 'Unknown User'}`);
          console.log(`   To Expert: ${expertUser?.name || 'Unknown Expert'} (ID: ${req.expertId})`);
          console.log(`   Status: ${req.status}`);
          console.log(`   Created: ${req.createdAt}`);
        }
      } else {
        console.log('   ⚠️ No chat requests found in database!');
        console.log('   This might be why the expert page shows no requests.');
      }
    } else {
      console.log('   ⚠️ No approved experts found!');
      console.log('   Please approve an expert application first.');
    }

    // 5. Check for users
    console.log('\n5️⃣ Checking users...');
    const users = await User.find({});
    console.log(`   Total users: ${users.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testExpertRequests();
