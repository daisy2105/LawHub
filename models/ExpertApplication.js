const mongoose = require('mongoose');

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
        required: false, // Made optional since some lawyers might not have one yet
        unique: true,
        sparse: true // This allows multiple null/undefined values while keeping unique constraint for actual values
    },
    licenseYear: { 
        type: Number, 
        required: true 
    },
    experience: { 
    type: String, // Accepts both number and range as string (e.g., "6", "6-10")
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

module.exports = mongoose.model('ExpertApplication', expertApplicationSchema);