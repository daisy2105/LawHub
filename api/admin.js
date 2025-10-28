const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const ExpertApplication = require('../models/ExpertApplication'); // Use centralized model

// SIMPLE Admin Stats - just like login/signup logic
router.get('/admin/stats', async (req, res) => {
  try {
    console.log('📊 Simple admin stats requested');
    
    // Simple counts - just like User.countDocuments()
    const totalUsers = await User.countDocuments();
    const totalExperts = await ExpertApplication.countDocuments();
    const pendingExperts = await ExpertApplication.countDocuments({ status: 'pending' });
    const approvedExperts = await ExpertApplication.countDocuments({ status: 'approved' });
    
    console.log('� Stats:', { totalUsers, totalExperts, pendingExperts, approvedExperts });
    
    res.json({
      success: true,
      totalUsers,
      totalExperts,
      pendingExperts,
      approvedExperts
    });
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.json({
      success: false,
      totalUsers: 0,
      totalExperts: 0,
      pendingExperts: 0,
      approvedExperts: 0
    });
  }
});

// SIMPLE Expert Applications List - just like User.find()
router.get('/admin/expert-applications', async (req, res) => {
  try {
    console.log('� Simple expert applications requested');
    
    // Simple find - just like User.find()
    const applications = await ExpertApplication.find({}).sort({ submittedAt: -1 });
    
    console.log('� Found', applications.length, 'applications');
    
    res.json({
      success: true,
      applications: applications
    });
    
  } catch (error) {
    console.error('❌ Error getting applications:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// SIMPLE Single Expert Application Details - just like User.findById()
router.get('/admin/expert-applications/:id', async (req, res) => {
  try {
    console.log('👨‍⚖️ Simple expert application details requested for:', req.params.id);
    
    // Simple findById - just like basic operations
    const application = await ExpertApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Expert application not found'
      });
    }
    
    console.log('👨‍⚖️ Found expert application:', application.userName || application.userEmail);
    console.log('👨‍⚖️ Raw application data:', JSON.stringify(application, null, 2));
    
    // Format the response to match the frontend expectations
    const formattedApplication = {
      _id: application._id,
      
      // Personal Information
      name: application.userName || 'N/A',
      email: application.userEmail || 'N/A',
      
      // Professional Details  
      barCouncilId: application.barCouncilId || 'N/A',
      licenseYear: application.licenseYear || 'N/A',
      experience: application.experience || 'N/A',
      specialization: application.specialization || 'N/A',
      firmName: application.firmName || 'Not specified',
      
      // Education & Background
      education: application.education || 'N/A',
      location: application.location || 'N/A',
      courts: application.courts || 'Not specified',
      languages: application.languages || 'N/A',
      availability: application.availability || 'Not specified',
      
      // Professional Bio
      bio: application.bio || 'No bio provided',
      
      // Application Status
      status: application.status || 'pending',
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      reviewNotes: application.reviewNotes,
      
      // Keep original data for debugging
      _original: application
    };
    
    res.json({
      success: true,
      application: formattedApplication
    });
    
  } catch (error) {
    console.error('❌ Error getting expert application details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SIMPLE Update Application Status - just like User.updateOne()
router.put('/admin/expert-applications/:id', async (req, res) => {
  try {
    console.log('✏️ Simple update application:', req.params.id);
    
    const { action, notes } = req.body;
    
    // Simple updateOne - just like user updates
    const result = await ExpertApplication.updateOne(
      { _id: req.params.id },
      { 
        status: action,
        reviewedAt: new Date(),
        reviewNotes: notes || '',
        updatedAt: new Date()
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }
    
    console.log('✅ Application updated successfully');
    res.json({ 
      success: true, 
      message: `Application ${action} successfully` 
    });
    
  } catch (error) {
    console.error('❌ Error updating application:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// SIMPLE Recent Activity - just basic data
router.get('/admin/recent-activity', async (req, res) => {
  try {
    console.log('📈 Simple recent activity requested');
    
    // Simple recent users - just like User.find()
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    // Simple format - just like other responses
    const activities = recentUsers.map(user => ({
      userName: user.name,
      userEmail: user.email,
      action: 'User Registration',
      details: 'New user registered',
      timestamp: user.createdAt
    }));
    
    console.log('📈 Sending', activities.length, 'activities');
    
    res.json({
      success: true,
      activities: activities
    });
    
  } catch (error) {
    console.error('❌ Error getting activities:', error);
    res.json({
      success: true,
      activities: []
    });
  }
});

// SIMPLE Users List - just like User.find()
router.get('/admin/users', async (req, res) => {
  try {
    console.log('👥 Simple users list requested');
    
    // Simple find - just like login logic
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });
    
    console.log('👥 Found', users.length, 'users');
    
    res.json({
      success: true,
      users: users
    });
    
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SIMPLE Single User Details - just like User.findById()
router.get('/admin/users/:id', async (req, res) => {
  try {
    console.log('👤 Simple user details requested for:', req.params.id);
    
    // Simple findById - just like basic operations
    const user = await User.findById(req.params.id, '-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Also fetch profile data from user_profiles collection
    const userProfile = await UserProfile.findOne({ userId: req.params.id });
    
    console.log('👤 Found user:', user.name);
    console.log('👤 Profile data:', userProfile ? 'Found' : 'Not found');
    
    // Combine user and profile data
    const completeUserData = {
      ...user.toObject(),
      profileDetails: userProfile || {}
    };
    
    res.json({
      success: true,
      user: completeUserData
    });
    
  } catch (error) {
    console.error('❌ Error getting user details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SIMPLE Delete User - just like basic deleteOne
router.delete('/admin/users/:id', async (req, res) => {
  try {
    console.log('🗑️ Simple delete user:', req.params.id);
    
    // Simple deletion - just like basic operations
    await User.findByIdAndDelete(req.params.id);
    await ExpertApplication.deleteMany({ userId: req.params.id });
    
    console.log('✅ User deleted successfully');
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SIMPLE Search History - Get AI search history for admin
router.get('/admin/search-history', async (req, res) => {
  try {
    console.log('🔍 Admin search history requested');
    
    // Import SearchHistory model
    const SearchHistory = mongoose.model('SearchHistory');
    
    // Get search history with user details
    const searchHistory = await SearchHistory.find({})
      .populate('userId', 'email name')
      .sort({ searchedAt: -1 })
      .limit(100); // Limit to recent 100 searches
    
    console.log('📊 Found', searchHistory.length, 'search records');
    
    res.json({
      success: true,
      searches: searchHistory.map(search => ({
        id: search._id,
        user: {
          id: search.userId?._id,
          email: search.userId?.email || 'Unknown',
          name: search.userId?.name || 'Unknown User'
        },
        query: search.query,
        response: search.response.substring(0, 200) + (search.response.length > 200 ? '...' : ''), // Truncate for admin view
        model: search.model,
        searchedAt: search.searchedAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error getting search history:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      searches: []
    });
  }
});

// SIMPLE Chat Connections - Get expert-user connections for admin
router.get('/admin/chat-connections', async (req, res) => {
  try {
    console.log('💬 Admin chat connections requested');
    
    // Import connection models
    const ConnectionRequest = mongoose.model('ConnectionRequest');
    
    // Get all connection requests with details
    const connections = await ConnectionRequest.find({})
      .sort({ requestedAt: -1 })
      .limit(100); // Limit to recent 100 connections
    
    // Get user and expert details for each connection
    const connectionsWithDetails = await Promise.all(
      connections.map(async (conn) => {
        try {
          const user = await User.findById(conn.userId);
          const expert = await ExpertApplication.findById(conn.expertId);
          
          return {
            id: conn._id,
            user: {
              id: conn.userId,
              email: user?.email || 'Unknown',
              name: user?.name || 'Unknown User'
            },
            expert: {
              id: conn.expertId,
              name: expert?.userName || 'Unknown Expert',
              email: expert?.userEmail || 'Unknown',
              specialization: expert?.specialization || 'Unknown'
            },
            status: conn.status,
            message: conn.message,
            requestedAt: conn.requestedAt,
            respondedAt: conn.respondedAt,
            chatSessionId: conn.chatSessionId
          };
        } catch (err) {
          console.error('Error processing connection:', err);
          return {
            id: conn._id,
            user: { id: conn.userId, email: 'Error loading', name: 'Error' },
            expert: { id: conn.expertId, name: 'Error loading', email: 'Error', specialization: 'Error' },
            status: conn.status,
            message: conn.message,
            requestedAt: conn.requestedAt,
            respondedAt: conn.respondedAt,
            chatSessionId: conn.chatSessionId
          };
        }
      })
    );
    
    console.log('🔗 Found', connections.length, 'connection records');
    
    res.json({
      success: true,
      connections: connectionsWithDetails
    });
    
  } catch (error) {
    console.error('❌ Error getting chat connections:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      connections: []
    });
  }
});

module.exports = router;