const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ExpertApplication = require('../models/ExpertApplication');

const JWT_SECRET = process.env.JWT_SECRET || 'lawhub-secret-key-2025';

// Middleware to authenticate user
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// GET /api/experts - Get all approved experts (public endpoint)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching approved experts...');
    
    // Fetch all approved expert applications
    const approvedExperts = await ExpertApplication.find({ status: 'approved' })
      .select('-documents -reviewNotes') // Exclude large fields
      .sort({ submittedAt: -1 });
    
    console.log(`✅ Found ${approvedExperts.length} approved experts`);
    
    // Transform to frontend-friendly format
    const experts = approvedExperts.map(expert => ({
      id: expert._id.toString(),
      userId: expert.userId,
      name: expert.userName || 'Legal Expert',
      email: expert.userEmail,
      avatar: '👨‍⚖️', // Default avatar
      specialization: expert.specialization,
      experience: expert.experience,
      bio: expert.bio,
      barCouncilId: expert.barCouncilId,
      licenseYear: expert.licenseYear,
      firmName: expert.firmName,
      location: expert.location,
      education: expert.education,
      certifications: expert.certifications,
      languages: expert.languages,
      availability: expert.availability || '9am-5pm',
      courts: expert.courts,
      isOnline: true, // For now, assume all are online (can be enhanced later)
      approvedAt: expert.reviewedAt
    }));
    
    res.json({ success: true, experts });
    
  } catch (error) {
    console.error('❌ Error fetching experts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load experts',
      error: error.message 
    });
  }
});

// GET /api/experts/:id - Get single expert details
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('🔍 Fetching expert details:', req.params.id);
    
    const expert = await ExpertApplication.findOne({ 
      _id: req.params.id,
      status: 'approved' 
    }).select('-documents -reviewNotes');
    
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }
    
    console.log('✅ Expert details retrieved');
    
    // Transform to frontend-friendly format
    const expertData = {
      id: expert._id.toString(),
      userId: expert.userId,
      name: expert.userName || 'Legal Expert',
      email: expert.userEmail,
      avatar: '👨‍⚖️',
      specialization: expert.specialization,
      experience: expert.experience,
      bio: expert.bio,
      barCouncilId: expert.barCouncilId,
      licenseYear: expert.licenseYear,
      firmName: expert.firmName,
      location: expert.location,
      education: expert.education,
      certifications: expert.certifications,
      languages: expert.languages,
      availability: expert.availability || '9am-5pm',
      courts: expert.courts,
      isOnline: true,
      approvedAt: expert.reviewedAt
    };
    
    res.json({ success: true, expert: expertData });
    
  } catch (error) {
    console.error('❌ Error fetching expert details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load expert details',
      error: error.message 
    });
  }
});

// GET /api/experts/specializations - Get list of specializations
router.get('/specializations', (req, res) => {
  const specializations = [
    { value: 'Criminal Law', label: 'Criminal Law' },
    { value: 'Civil Law', label: 'Civil Law' },
    { value: 'Corporate Law', label: 'Corporate Law' },
    { value: 'Family Law', label: 'Family Law' },
    { value: 'Property Law', label: 'Property Law' },
    { value: 'Tax Law', label: 'Tax Law' },
    { value: 'Labor Law', label: 'Labor Law' },
    { value: 'Intellectual Property', label: 'Intellectual Property' },
    { value: 'Constitutional Law', label: 'Constitutional Law' },
    { value: 'Environmental Law', label: 'Environmental Law' },
    { value: 'Immigration Law', label: 'Immigration Law' },
    { value: 'Consumer Protection', label: 'Consumer Protection' }
  ];
  
  res.json({ success: true, specializations });
});

module.exports = router;
