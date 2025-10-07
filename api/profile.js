const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Middleware to verify JWT token
const { verifyToken } = require('../middleware/auth');

// Profile Management Routes

// Create or Update User Profile
router.post('/create', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.user._id;
        
        const profileData = {
            userId: new ObjectId(userId),
            dateOfBirth: req.body.dateOfBirth,
            phone: req.body.phone,
            city: req.body.city,
            status: req.body.status,
            collegeName: req.body.collegeName || null,
            course: req.body.course || null,
            companyName: req.body.companyName || null,
            designation: req.body.designation || null,
            learningGoal: req.body.learningGoal,
            interests: req.body.interests || [],
            profilePicture: req.body.profilePicture || null,
            isComplete: true,
            updatedAt: new Date()
        };

        // Check if profile already exists
        const existingProfile = await db.collection('user_profiles').findOne({ userId: new ObjectId(userId) });
        
        if (existingProfile) {
            // Update existing profile
            await db.collection('user_profiles').updateOne(
                { userId: new ObjectId(userId) },
                { $set: profileData }
            );
            
            // Log activity
            await logActivity(db, userId, 'profile_update', 'User profile updated', req.ip);
            
            res.json({ success: true, message: 'Profile updated successfully' });
        } else {
            // Create new profile
            profileData.createdAt = new Date();
            await db.collection('user_profiles').insertOne(profileData);
            
            // Log activity
            await logActivity(db, userId, 'profile_create', 'User profile created', req.ip);
            
            res.json({ success: true, message: 'Profile created successfully' });
        }
    } catch (error) {
        console.error('Profile creation/update error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get User Profile
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        
        // Verify user can access this profile (either own profile or admin)
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const profile = await db.collection('user_profiles').findOne({ userId: new ObjectId(userId) });
        
        if (!profile) {
            return res.json({ success: true, profile: null, isComplete: false });
        }
        
        res.json({ success: true, profile, isComplete: profile.isComplete });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Check Profile Completion Status
router.get('/status/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        
        // Verify user can access this profile status
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const profile = await db.collection('user_profiles').findOne(
            { userId: new ObjectId(userId) },
            { projection: { isComplete: 1 } }
        );
        
        res.json({ 
            success: true, 
            isComplete: profile ? profile.isComplete : false 
        });
    } catch (error) {
        console.error('Profile status check error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete User Profile
router.delete('/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        
        // Verify user can delete this profile
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        await db.collection('user_profiles').deleteOne({ userId: new ObjectId(userId) });
        
        // Log activity
        await logActivity(db, userId, 'profile_delete', 'User profile deleted', req.ip);
        
        res.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Profile deletion error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Helper function to log user activity
async function logActivity(db, userId, activityType, description, ipAddress, metadata = {}) {
    try {
        await db.collection('user_activities').insertOne({
            userId: new ObjectId(userId),
            activityType,
            description,
            metadata,
            timestamp: new Date(),
            ipAddress: ipAddress || 'unknown'
        });
    } catch (error) {
        console.error('Activity logging error:', error);
    }
}

module.exports = router;
