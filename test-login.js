const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const MONGODB_URI = process.env.MONGODB_URI;

async function testLogin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Load User model
        const User = require('./models/User');
        
        // Check if user exists
        const email = 'byrosebegum@gmail.com';
        console.log(`🔍 Looking for user: ${email}`);
        
        const user = await User.findByEmail(email);
        if (user) {
            console.log('✅ User found:', {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                lastLogin: user.lastLogin
            });
            
            // Test password (you'll need to provide the correct password)
            const testPassword = 'test123'; // Replace with actual password
            const isValid = await user.comparePassword(testPassword);
            console.log('🔐 Password test result:', isValid);
        } else {
            console.log('❌ User not found');
            
            // List all users
            console.log('📋 All users in database:');
            const allUsers = await User.find({}, 'name email isActive lastLogin');
            console.log(allUsers);
        }
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testLogin();