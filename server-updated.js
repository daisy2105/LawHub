// server.js - Updated to include new routes

const express = require('express');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lawhub';
let db;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for profile pictures
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Session middleware for login tracking
app.use(session({
    secret: process.env.SESSION_SECRET || 'lawhub-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI
    }),
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db();
        app.locals.db = db;
        
        // Create indexes for better performance
        createIndexes();
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Create database indexes
async function createIndexes() {
    try {
        // User profiles indexes
        await db.collection('user_profiles').createIndex({ userId: 1 }, { unique: true });
        await db.collection('user_profiles').createIndex({ isComplete: 1 });
        
        // Login logs indexes
        await db.collection('login_logs').createIndex({ userId: 1 });
        await db.collection('login_logs').createIndex({ loginTime: -1 });
        
        // User activities indexes
        await db.collection('user_activities').createIndex({ userId: 1 });
        await db.collection('user_activities').createIndex({ timestamp: -1 });
        await db.collection('user_activities').createIndex({ activityType: 1 });
        
        // Users collection indexes (if not already exist)
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Import route handlers
const authRoutes = require('./api/auth'); // Your existing auth routes
const profileRoutes = require('./api/profile');
const activityRoutes = require('./api/activity');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/activity', activityRoutes);

// Analytics routes
app.get('/api/analytics/dashboard/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (req.user.id !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Get comprehensive user analytics
        const [profile, loginStats, activityStats] = await Promise.all([
            db.collection('user_profiles').findOne({ userId: new ObjectId(userId) }),
            getLoginStats(userId),
            getActivityStats(userId)
        ]);
        
        res.json({
            success: true,
            analytics: {
                profile: profile ? {
                    isComplete: profile.isComplete,
                    status: profile.status,
                    city: profile.city,
                    interests: profile.interests || []
                } : null,
                loginStats,
                activityStats
            }
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Helper functions for analytics
async function getLoginStats(userId) {
    const { ObjectId } = require('mongodb');
    
    const totalLogins = await db.collection('login_logs').countDocuments({ 
        userId: new ObjectId(userId) 
    });
    
    const lastLogin = await db.collection('login_logs').findOne(
        { userId: new ObjectId(userId) },
        { sort: { loginTime: -1 } }
    );
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyLogins = await db.collection('login_logs').countDocuments({
        userId: new ObjectId(userId),
        loginTime: { $gte: thisMonth }
    });
    
    return {
        total: totalLogins,
        lastLogin: lastLogin?.loginTime || null,
        thisMonth: monthlyLogins
    };
}

async function getActivityStats(userId) {
    const { ObjectId } = require('mongodb');
    
    const totalActivities = await db.collection('user_activities').countDocuments({
        userId: new ObjectId(userId)
    });
    
    const topActivities = await db.collection('user_activities').aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]).toArray();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = await db.collection('user_activities').countDocuments({
        userId: new ObjectId(userId),
        timestamp: { $gte: today }
    });
    
    return {
        total: totalActivities,
        today: todayActivities,
        topActivities
    };
}

// JWT verification middleware
function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple-index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'modern-dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login2.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup2.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'LawHub API is running',
        timestamp: new Date(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`LawHub server running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;