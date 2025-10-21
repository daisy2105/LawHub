const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'lawhub-secret-key-2025';
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5501', 'http://127.0.0.1:5501', 'http://localhost:3000'],
  credentials: true
}));

// Increase payload size limit for profile pictures
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'lawhub-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🗄️ MongoDB Connected Successfully');
    
    // Create database indexes for better performance
    await createDatabaseIndexes();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Create database indexes
async function createDatabaseIndexes() {
  try {
    const db = mongoose.connection.db;
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // User profiles indexes
    await db.collection('user_profiles').createIndex({ userId: 1 }, { unique: true });
    await db.collection('user_profiles').createIndex({ isComplete: 1 });
    
    // Login logs indexes
    await db.collection('login_logs').createIndex({ userId: 1 });
    await db.collection('login_logs').createIndex({ loginTime: -1 });
    
    // User activities indexes
    await db.collection('user_activities').createIndex({ userId: 1 });
    await db.collection('user_activities').createIndex({ timestamp: -1 });
    
    // Expert applications indexes - handle barCouncilId properly
    try {
      // Drop the old barCouncilId index if it exists and recreate with sparse option
      await db.collection('expertapplications').dropIndex('barCouncilId_1');
      console.log('🗑️ Dropped old barCouncilId index');
    } catch (err) {
      // Index might not exist, which is fine
      console.log('ℹ️ barCouncilId index not found (or already correct)');
    }
    
    // Create new sparse unique index for barCouncilId
    await db.collection('expertapplications').createIndex(
      { barCouncilId: 1 }, 
      { unique: true, sparse: true }
    );
    await db.collection('expertapplications').createIndex({ userId: 1 });
    await db.collection('expertapplications').createIndex({ status: 1 });
    await db.collection('expertapplications').createIndex({ email: 1 });
    
    console.log('📊 Database indexes created successfully');
  } catch (error) {
    console.warn('⚠️ Index creation warning:', error.message);
  }
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./api/profile'));
app.use('/api/activity', require('./api/activity'));
app.use('/api', require('./api/expert')); // Use the correct expert.js with proper field mappings
app.use('/api', require('./api/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LawHub API is running',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Cleanup endpoint for corrupted expert applications
app.get('/api/cleanup-expert-applications', async (req, res) => {
  try {
    console.log('🧹 Starting expert applications cleanup...');
    
    const { MongoClient } = require('mongodb');
  const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('lawhub');
    
    // Get all documents in the collection
    const rawDocs = await db.collection("expertapplications").find({}).toArray();
    console.log('🔍 Found', rawDocs.length, 'documents in expertapplications collection');
    
    let deletedCount = 0;
    for (const doc of rawDocs) {
      // Check if this document has validation issues
      let hasIssues = false;
      const issues = [];
      
      if (doc.documents && doc.documents.length > 0 && typeof doc.documents[0] === 'string') {
        hasIssues = true;
        issues.push('documents field contains string instead of objects');
      }
      
      if (doc.termsAccepted && typeof doc.termsAccepted === 'string') {
        hasIssues = true;
        issues.push('termsAccepted is string instead of boolean');
      }
      
      if (doc.dataConsent && typeof doc.dataConsent === 'string') {
        hasIssues = true;
        issues.push('dataConsent is string instead of boolean');
      }
      
      if (!doc.userId) {
        hasIssues = true;
        issues.push('missing userId field');
      }
      
      if (hasIssues) {
        console.log('🗑️ Deleting corrupted document:', doc._id, 'Issues:', issues);
        await db.collection("expertapplications").deleteOne({ _id: doc._id });
        deletedCount++;
      }
    }
    
    await client.close();
    
    console.log('✅ Cleanup completed. Deleted', deletedCount, 'corrupted documents');
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} corrupted documents`,
      totalDocuments: rawDocs.length,
      deletedCount: deletedCount,
      clearLocalStorageScript: `
        <script>
          localStorage.removeItem('expertApplicationSubmitted');
          localStorage.removeItem('expertApplicationSubmittedAt');
          alert('Database and localStorage cleaned! You can now submit new applications.');
          window.location.href = '/modern-dashboard.html';
        </script>
      `
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed: ' + error.message
    });
  }
});

// Frontend localStorage reset endpoint
app.get('/api/reset-expert-application', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reset Expert Application</title>
    </head>
    <body>
      <h2>🧹 Resetting Expert Application Status...</h2>
      <script>
        localStorage.removeItem('expertApplicationSubmitted');
        localStorage.removeItem('expertApplicationSubmittedAt');
        alert('Expert application status reset! You can now submit new applications.');
        window.location.href = '/modern-dashboard.html';
      </script>
    </body>
    </html>
  `);
});

// Simple test endpoint without authentication
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    server: 'localhost:3000',
    timestamp: new Date()
  });
});

// Create ExpertApplication model
const expertApplicationSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  email: String,
  phoneNumber: String,
  expertise: String,
  yearsOfExperience: String,
  education: String,
  certifications: String,
  languagesSpoken: String,
  preferredConsultationHours: String,
  // Additional required fields
  barCouncilId: String,
  licenseYear: Number,
  firmName: String,
  location: String,
  courts: String,
  bio: String,
  documents: [{ name: String, type: String, size: Number, data: String }],
  termsAccepted: Boolean,
  dataConsent: Boolean,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: Date,
  reviewNotes: String,
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let ExpertApplication;
try {
  ExpertApplication = mongoose.model('ExpertApplication');
} catch {
  ExpertApplication = mongoose.model('ExpertApplication', expertApplicationSchema);
}

// ADMIN DASHBOARD ENDPOINTS
app.get('/api/admin/stats', async (req, res) => {
  console.log('📊 Admin stats requested');
  try {
    // Use simple mongoose queries
    const totalApplications = await ExpertApplication.countDocuments();
    const pendingApplications = await ExpertApplication.countDocuments({ status: 'pending' });
    const approvedApplications = await ExpertApplication.countDocuments({ status: 'approved' });
    
    // Count real users from User model
    const User = require('./models/User');
    const totalUsers = await User.countDocuments();
    
    console.log('📈 Stats computed:', {
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers,
        totalExperts: totalApplications,
        pendingExperts: pendingApplications,
        approvedExperts: approvedApplications
      }
    });
  } catch (error) {
    console.error('❌ Error getting admin stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/expert-applications', async (req, res) => {
  console.log('📋 Expert applications requested');
  try {
    // Use simple mongoose find
    const applications = await ExpertApplication.find({}).sort({ submittedAt: -1 });
    
    console.log('📄 Found', applications.length, 'applications');
    
    res.json({
      success: true,
      applications: applications
    });
  } catch (error) {
    console.error('❌ Error getting expert applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/expert-applications/:id', async (req, res) => {
  console.log('✏️ Updating application:', req.params.id, 'with action:', req.body.action);
  try {
    const { action, notes } = req.body;
    
    const updateData = {
      status: action, // 'approved' or 'rejected'
      reviewedAt: new Date(),
      reviewNotes: notes || '',
      updatedAt: new Date()
    };
    
    // Use simple mongoose updateOne
    const result = await ExpertApplication.updateOne(
      { _id: req.params.id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    console.log('✅ Application updated successfully');
    res.json({ success: true, message: `Application ${action} successfully` });
  } catch (error) {
    console.error('❌ Error updating application:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// SIMPLE EXPERT APPLICATION ENDPOINT - ENABLED
// REMOVED: Old expert application route - now using api/expert.js which has correct field mappings
// This route was using wrong field names (fullName vs name, expertise vs specialization, etc.)

// Get user's expert application status
app.get('/api/expert-application/status/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    console.log('🔍 Checking application status for email:', userEmail);
    
    // Find the most recent application for this email
    const application = await ExpertApplication.findOne({ 
      email: userEmail 
    }).sort({ createdAt: -1 });
    
    if (!application) {
      return res.json({
        success: true,
        hasApplication: false,
        status: 'none'
      });
    }
    
    console.log('📋 Found application with status:', application.status);
    
    res.json({
      success: true,
      hasApplication: true,
      status: application.status,
      applicationId: application._id,
      submittedAt: application.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error checking application status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check application status: ' + error.message 
    });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login2.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup2.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'modern-dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// SUPER SIMPLE ADMIN STATS - NO COMPLICATIONS
app.get('/api/simple-stats', async (req, res) => {
  console.log('🔥 SIMPLE STATS API CALLED');
  
  try {
    // Use Mongoose for consistency
    let ExpertApplication;
    try {
      ExpertApplication = mongoose.model('ExpertApplication');
    } catch (err) {
      // Model doesn't exist, create it (same schema as above)
      const expertApplicationSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userEmail: String,
        userName: String,
        barCouncilId: { type: String, required: true },
        licenseYear: { type: Number, required: true },
        experience: { type: String, required: true },
        specialization: { type: String, required: true },
        firmName: String,
        location: { type: String, required: true },
        education: { type: String, required: true },
        courts: String,
        bio: { type: String, required: true },
        certifications: String,
        languages: { type: String, required: true },
        availability: { type: String, default: '9am-5pm' },
        documents: [{ name: String, type: String, size: Number, data: String }],
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'under-review'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: Date,
        reviewNotes: String,
        rejectionReason: String,
        termsAccepted: { type: Boolean, required: true },
        dataConsent: { type: Boolean, required: true },
        submittedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }, { timestamps: true });
      
      ExpertApplication = mongoose.model('ExpertApplication', expertApplicationSchema);
    }
    
    // Use MongoDB direct connection for users count (since users might not have Mongoose model in server.js)
    const MongoClient = require('mongodb').MongoClient;
  const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('lawhub');
    
    // Simple counts
    const totalUsers = await db.collection('users').countDocuments();
    const totalExperts = await ExpertApplication.countDocuments();
    const pendingExperts = await ExpertApplication.countDocuments({ status: 'pending' });
    const approvedExperts = await ExpertApplication.countDocuments({ status: 'approved' });
    
    client.close();
    
    const result = {
      success: true,
      totalUsers,
      totalExperts,
      pendingExperts,
      approvedExperts,
      timestamp: new Date()
    };
    
    console.log('✅ SIMPLE STATS RESULT:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ SIMPLE STATS ERROR:', error);
    res.json({
      success: false,
      error: error.message,
      totalUsers: 0,
      totalExperts: 0,
      pendingExperts: 0,
      approvedExperts: 0
    });
  }
});

app.get('/admin-working', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-working.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LawHub Server running on http://localhost:${PORT}`);
    console.log(`🌐 NETWORK ACCESS: Server accessible from other computers!`);
    console.log(`📱 Access your app at:`);
    console.log(`   - Home: http://localhost:${PORT}`);
    console.log(`   - Login: http://localhost:${PORT}/login`);
    console.log(`   - Signup: http://localhost:${PORT}/signup`);
    console.log(`   - Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔗 API Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`   - Profile: http://localhost:${PORT}/api/profile/*`);
    console.log(`   - Activity: http://localhost:${PORT}/api/activity/*`);
  });
};

startServer().catch(console.error);

module.exports = app;