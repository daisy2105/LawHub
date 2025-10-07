const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');

// Expert Application Schema
const expertApplicationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Personal Info
    userEmail: String,
    userName: String,
    
    // Professional Details
    barCouncilId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    licenseYear: { 
        type: Number, 
        required: true 
    },
    experience: { 
        type: String, 
        required: true 
    },
    specialization: { 
        type: String, 
        required: true 
    },
    
    // Practice Information
    firmName: String,
    location: { 
        type: String, 
        required: true 
    },
    education: { 
        type: String, 
        required: true 
    },
    courts: String,
    
    // Professional Profile
    bio: { 
        type: String, 
        required: true 
    },
    certifications: String,
    languages: { 
        type: String, 
        required: true 
    },
    availability: { 
        type: String, 
        default: '9am-5pm' 
    },
    
    // Documents
    documents: [{
        name: String,
        type: String,
        size: Number,
        data: String // Base64 encoded
    }],
    
    // Application Status
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'under-review'], 
        default: 'pending' 
    },
    
    // Review Information
    reviewedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String,
    
    // Consent and Terms
    termsAccepted: { 
        type: Boolean, 
        required: true 
    },
    dataConsent: { 
        type: Boolean, 
        required: true 
    },
    
    // Timestamps
    submittedAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Create index for faster queries
expertApplicationSchema.index({ userId: 1 });
expertApplicationSchema.index({ barCouncilId: 1 });
expertApplicationSchema.index({ status: 1 });

const ExpertApplication = mongoose.model('ExpertApplication', expertApplicationSchema);

// Submit Expert Application (simplified for testing)
router.post('/expert-application', async (req, res) => {
    try {
        console.log('🔥 Expert application POST request received');
        console.log('🔍 Headers:', req.headers);
        console.log('📝 Body received:', req.body);
        
        // For testing - just return success for now
        console.log('✅ Expert application test successful');
        
        res.status(201).json({
            success: true,
            message: 'Expert application submitted successfully (test mode)',
            applicationId: 'test-id-123'
        });
        
    } catch (error) {
        console.error('Expert application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit expert application',
            error: error.message
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