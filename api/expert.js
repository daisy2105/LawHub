const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const ExpertApplication = require('../models/ExpertApplication'); // Use centralized model

// Submit Expert Application (proper implementation)
router.post('/expert-application', verifyToken, async (req, res) => {
    try {
        console.log('🔥 Expert application POST request received');
        console.log('User ID from token:', req.user._id);
        console.log('Form data received:', req.body);
        
        // Check if user already has an application
        const existingApplication = await ExpertApplication.findOne({ userId: req.user._id });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted an expert application'
            });
        }
        
        // User already available from verifyToken middleware
        const user = req.user;
        
        // Create expert application with user details
        // Accept both yearsOfExperience (number) and experience (string)
        let experienceValue = req.body.experience;
        if (!experienceValue && req.body.yearsOfExperience) {
            experienceValue = String(req.body.yearsOfExperience);
        }
        // If yearsOfExperience is a range (e.g., "6-10"), keep as string
        if (!experienceValue && req.body.yearsOfExperienceRange) {
            experienceValue = req.body.yearsOfExperienceRange;
        }
        
        // Debug: Log all incoming data
        console.log('📊 All request body fields:', Object.keys(req.body));
        console.log('📊 Request body data:', JSON.stringify(req.body, null, 2));
        
        const expertApplication = new ExpertApplication({
            userId: req.user._id,
            userEmail: req.body.email || user.email, // Use from request or fallback to user
            userName: req.body.name || user.name,    // Use from request or fallback to user
            barCouncilId: req.body.barCouncilId,
            licenseYear: parseInt(req.body.licenseYear),
            experience: experienceValue || req.body.experience,
            specialization: req.body.specialization,
            firmName: req.body.firmName || '',
            location: req.body.location,
            education: req.body.education,
            courts: req.body.courts || '',
            bio: req.body.bio,
            certifications: req.body.certifications || '',
            languages: req.body.languages,
            availability: req.body.availability || '9am-5pm',
            termsAccepted: req.body.termsAccepted || true,
            dataConsent: req.body.dataConsent || true,
            status: 'pending',
            submittedAt: new Date()
        });
        
        // Debug: Log what we're about to save
        console.log('💾 About to save expert application:', JSON.stringify(expertApplication.toObject(), null, 2));
        
        // Save to database
        await expertApplication.save();
        
        // Debug: Verify what was actually saved
        const savedApplication = await ExpertApplication.findById(expertApplication._id);
        console.log('✅ Expert application saved successfully');
        console.log('🔍 Saved data verification:', JSON.stringify(savedApplication.toObject(), null, 2));
        
        res.status(201).json({
            success: true,
            message: 'Expert application submitted successfully',
            applicationId: expertApplication._id,
            savedData: savedApplication // Include for debugging
        });
        
    } catch (error) {
        console.error('Expert application error:', error);
        
        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map(key => {
                return `${key}: ${error.errors[key].message}`;
            });
            console.error('❌ Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed: ' + validationErrors.join(', '),
                validationErrors: validationErrors
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bar Council ID already registered'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to submit expert application: ' + error.message,
            errorDetails: error.toString()
        });
    }
});

// Get user's expert application status
router.get('/expert-application/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User authentication required' 
            });
        }
        
        const application = await ExpertApplication.findOne({ userId: userId })
            .select('-documents.data') // Exclude large document data
            .sort({ submittedAt: -1 }); // Get latest application
        
        if (!application) {
            return res.json({
                success: true,
                hasApplication: false,
                message: 'No expert application found'
            });
        }
        
        res.json({
            success: true,
            hasApplication: true,
            application: {
                id: application._id,
                status: application.status,
                submittedAt: application.submittedAt,
                reviewedAt: application.reviewedAt,
                specialization: application.specialization,
                experience: application.experience,
                location: application.location
            }
        });
        
    } catch (error) {
        console.error('Get expert application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get application status'
        });
    }
});

module.exports = router;