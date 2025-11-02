// Test script to verify Expert Chat System models
require('dotenv').config();
const mongoose = require('mongoose');

async function testModels() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Load models
        const ChatRequest = require('./models/ChatRequest');
        const Conversation = require('./models/Conversation');
        const Message = require('./models/Message');
        const User = require('./models/User');
        
        console.log('📦 Models loaded successfully:');
        console.log('  ✅ ChatRequest');
        console.log('  ✅ Conversation');
        console.log('  ✅ Message');
        console.log('  ✅ User');
        
        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📂 Available collections:');
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Count documents
        console.log('\n📊 Document counts:');
        console.log(`  ChatRequests: ${await ChatRequest.countDocuments()}`);
        console.log(`  Conversations: ${await Conversation.countDocuments()}`);
        console.log(`  Messages: ${await Message.countDocuments()}`);
        console.log(`  Users: ${await User.countDocuments()}`);
        
        console.log('\n✅ All systems ready!');
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testModels();
