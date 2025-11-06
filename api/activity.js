const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Middleware to verify JWT token
const { verifyToken } = require('../middleware/auth');

// Activity and Login Tracking Routes

// Log User Login
router.post('/login', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.user._id;
        
        const loginData = {
            userId: new ObjectId(userId),
            loginTime: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            deviceInfo: parseUserAgent(req.get('User-Agent')),
            createdAt: new Date()
        };
        
        // Insert login log
        const result = await db.collection('login_logs').insertOne(loginData);
        
        // Store session ID for logout tracking
        req.session.loginLogId = result.insertedId;
        
        // Log general activity
        await logActivity(db, userId, 'login', 'User logged in', req.ip, {
            userAgent: req.get('User-Agent'),
            deviceInfo: loginData.deviceInfo
        });
        
        res.json({ success: true, message: 'Login logged successfully' });
    } catch (error) {
        console.error('Login logging error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Log User Logout
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const loginLogId = req.session?.loginLogId;
        
        if (loginLogId) {
            // Find the login record and calculate session duration
            const loginRecord = await mongoose.connection.db.collection('login_logs').findOne({ _id: new ObjectId(loginLogId) });
            
            if (loginRecord) {
                const logoutTime = new Date();
                const sessionDuration = Math.round((logoutTime - loginRecord.loginTime) / (1000 * 60)); // in minutes
                
                // Update login log with logout time and duration
                await mongoose.connection.db.collection('login_logs').updateOne(
                    { _id: new ObjectId(loginLogId) },
                    { 
                        $set: { 
                            logoutTime: logoutTime,
                            sessionDuration: sessionDuration
                        }
                    }
                );
            }
        }
        
        // Log general activity
        await logActivity(db, userId, 'logout', 'User logged out', req.ip);
        
        // Clear session
        req.session.destroy();
        
        res.json({ success: true, message: 'Logout logged successfully' });
    } catch (error) {
        console.error('Logout logging error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get User Login History
router.get('/logs/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        // Verify user can access these logs
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const logs = await db.collection('login_logs')
            .find({ userId: new ObjectId(userId) })
            .sort({ loginTime: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const totalLogs = await db.collection('login_logs').countDocuments({ userId: new ObjectId(userId) });
        
        res.json({ 
            success: true, 
            logs, 
            pagination: {
                current: page,
                total: Math.ceil(totalLogs / limit),
                count: logs.length,
                totalRecords: totalLogs
            }
        });
    } catch (error) {
        console.error('Login logs fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Track General User Activity
router.post('/track', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.user._id;
        const { activityType, description, metadata } = req.body;
        
        await logActivity(db, userId, activityType, description, req.ip, metadata);
        
        res.json({ success: true, message: 'Activity tracked successfully' });
    } catch (error) {
        console.error('Activity tracking error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get User Activity History
router.get('/history/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 100;
        const activityType = req.query.type;
        
        // Verify user can access this history
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const filter = { userId: new ObjectId(userId) };
        if (activityType) {
            filter.activityType = activityType;
        }
        
        const activities = await db.collection('user_activities')
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        
        res.json({ success: true, activities });
    } catch (error) {
        console.error('Activity history fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get User Statistics
router.get('/stats/:userId', verifyToken, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const userId = req.params.userId;
        
        // Verify user can access these stats
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Get various statistics
        const totalLogins = await db.collection('login_logs').countDocuments({ userId: new ObjectId(userId) });
        
        const lastLogin = await db.collection('login_logs')
            .findOne({ userId: new ObjectId(userId) }, { sort: { loginTime: -1 } });
        
        const avgSessionDuration = await db.collection('login_logs').aggregate([
            { $match: { userId: new ObjectId(userId), sessionDuration: { $exists: true } } },
            { $group: { _id: null, avgDuration: { $avg: '$sessionDuration' } } }
        ]).toArray();
        
        const activityCount = await db.collection('user_activities').countDocuments({ userId: new ObjectId(userId) });
        
        const topActivities = await db.collection('user_activities').aggregate([
            { $match: { userId: new ObjectId(userId) } },
            { $group: { _id: '$activityType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();
        
        res.json({
            success: true,
            stats: {
                totalLogins,
                lastLogin: lastLogin?.loginTime || null,
                averageSessionDuration: avgSessionDuration[0]?.avgDuration || 0,
                totalActivities: activityCount,
                topActivities
            }
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
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

// Helper function to parse user agent
function parseUserAgent(userAgent) {
    const deviceInfo = {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown'
    };
    
    if (!userAgent) return deviceInfo;
    
    // Simple user agent parsing (in production, use a proper library like 'ua-parser-js')
    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';
    
    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';
    
    if (userAgent.includes('Mobile')) deviceInfo.device = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceInfo.device = 'Tablet';
    else deviceInfo.device = 'Desktop';
    
    return deviceInfo;
}

module.exports = router;
