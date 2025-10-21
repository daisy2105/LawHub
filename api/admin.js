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

module.exports = router;