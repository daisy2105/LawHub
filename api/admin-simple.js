const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// REAL admin dashboard statistics - FETCH FROM DATABASE
router.get('/admin/stats', async (req, res) => {
    try {
        console.log('📊 FETCHING REAL DATA FROM DATABASE');
        
        // Get real data from MongoDB
        const db = mongoose.connection.db;
        
        const totalUsers = await db.collection('users').countDocuments();
        const totalExperts = await db.collection('expertapplications').countDocuments();
        const pendingExperts = await db.collection('expertapplications').countDocuments({ status: 'pending' });
        const approvedExperts = await db.collection('expertapplications').countDocuments({ status: 'approved' });
        
        console.log(`📊 REAL Stats from DB: Users=${totalUsers}, Experts=${totalExperts}, Pending=${pendingExperts}, Approved=${approvedExperts}`);
        
        res.json({
            success: true,
            totalUsers,
            totalExperts,
            pendingExperts,
            approvedExperts
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// REAL recent activity - FETCH FROM DATABASE
router.get('/admin/recent-activity', async (req, res) => {
    try {
        console.log('📈 FETCHING REAL ACTIVITIES FROM DATABASE');
        
        const db = mongoose.connection.db;
        
        // Get real recent users from database
        const recentUsers = await db.collection('users')
            .find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
        
        console.log(`📊 Found ${recentUsers.length} real users in database`);
        
        const activities = recentUsers.map(user => ({
            userName: user.name,
            userEmail: user.email,
            action: 'User Registration',
            details: 'New user registered',
            timestamp: user.createdAt
        }));
        
        res.json({
            success: true,
            activities
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// REAL expert applications - FETCH FROM DATABASE  
router.get('/admin/expert-applications', async (req, res) => {
    try {
        console.log('🎓 FETCHING REAL EXPERT APPLICATIONS FROM DATABASE');
        
        const db = mongoose.connection.db;
        
        const expertApplications = await db.collection('expertapplications')
            .find({})
            .sort({ submittedAt: -1 })
            .toArray();
        
        console.log(`📊 Found ${expertApplications.length} real expert applications in database`);
        
        res.json({
            success: true,
            expertApplications
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// REAL users list - FETCH FROM DATABASE
router.get('/admin/users', async (req, res) => {
    try {
        console.log('👥 FETCHING REAL USERS FROM DATABASE');
        
        const db = mongoose.connection.db;
        
        const users = await db.collection('users')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        
        console.log(`📊 Found ${users.length} real users in database`);
        
        // Remove passwords from response
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        
        res.json({
            success: true,
            users: safeUsers
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// REAL single user details with profile - FETCH FROM BOTH COLLECTIONS
router.get('/admin/users/:id', async (req, res) => {
    try {
        console.log('👤 FETCHING USER AND PROFILE FROM DATABASE');
        
        const db = mongoose.connection.db;
        const ObjectId = mongoose.Types.ObjectId;
        
        // Get basic user info from users collection
        const user = await db.collection('users')
            .findOne({ _id: new ObjectId(req.params.id) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get profile data from user_profiles collection using userId
        console.log(`🔍 Looking for profile with userId: ${req.params.id}`);
        
        // Try multiple ways to find the profile
        let userProfile = await db.collection('user_profiles')
            .findOne({ userId: new ObjectId(req.params.id) });
            
        if (!userProfile) {
            // Try with string userId
            userProfile = await db.collection('user_profiles')
                .findOne({ userId: req.params.id });
        }
        
        if (!userProfile) {
            // Try matching by email
            userProfile = await db.collection('user_profiles')
                .findOne({ email: user.email });
        }
        
        console.log(`📊 Found user: ${user.name} (${user.email})`);
        console.log(`📋 Profile data: ${userProfile ? 'Found' : 'Not found'}`);
        if (userProfile) {
            console.log(`📋 Profile fields: ${Object.keys(userProfile).join(', ')}`);
        }
        // Remove password from user data
        const { password, ...safeUser } = user;
        
        // Merge user data with profile data
        const completeUserData = {
            ...safeUser,
            ...(userProfile || {}) // Add profile data if it exists
        };
        
        res.json({
            success: true,
            user: completeUserData
        });
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// DELETE user - REAL DATABASE OPERATION
router.delete('/admin/users/:id', async (req, res) => {
    try {
        console.log('🗑️ DELETING USER FROM DATABASE');
        
        const db = mongoose.connection.db;
        const ObjectId = mongoose.Types.ObjectId;
        const userId = req.params.id;
        
        console.log(`🗑️ Attempting to delete user with ID: ${userId}`);
        
        // First check if user exists
        const user = await db.collection('users')
            .findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`👤 Found user to delete: ${user.name} (${user.email})`);
        
        // Delete associated user profile
        const profileResult = await db.collection('user_profiles')
            .deleteMany({ 
                $or: [
                    { userId: new ObjectId(userId) },
                    { userId: userId },
                    { email: user.email }
                ]
            });
        
        console.log(`📋 Deleted ${profileResult.deletedCount} user profiles`);
        
        // Delete associated expert applications
        const expertResult = await db.collection('expertapplications')
            .deleteMany({ 
                $or: [
                    { userId: new ObjectId(userId) },
                    { userId: userId },
                    { email: user.email }
                ]
            });
        
        console.log(`🎓 Deleted ${expertResult.deletedCount} expert applications`);
        
        // Finally delete the user
        const userResult = await db.collection('users')
            .deleteOne({ _id: new ObjectId(userId) });
        
        if (userResult.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already deleted'
            });
        }
        
        console.log(`✅ Successfully deleted user: ${user.name}`);
        
        res.json({
            success: true,
            message: 'User and associated data deleted successfully',
            deletedUser: user.name,
            profilesDeleted: profileResult.deletedCount,
            expertApplicationsDeleted: expertResult.deletedCount
        });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user: ' + error.message
        });
    }
});

module.exports = router;