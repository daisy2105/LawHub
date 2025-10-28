const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const mongoose = require('mongoose');

// auth middlewares
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Models
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

// API Keys for different law sections
const API_KEYS = {
    'constitutional': 'const_law_2025_api_key_001',
    'criminal': 'crim_law_2025_api_key_002', 
    'civil': 'civil_law_2025_api_key_003',
    'commercial': 'comm_law_2025_api_key_004',
    'administrative': 'admin_law_2025_api_key_005',
    'family': 'family_law_2025_api_key_006',
    'environmental': 'env_law_2025_api_key_007',
    'cyber': 'cyber_law_2025_api_key_008',
    'consumer': 'consumer_law_2025_api_key_009',
    'labour': 'labour_law_2025_api_key_010'
};

// Mapping of section names to file names
const SECTION_FILES = {
    'constitutional': 'Constitutional_Law.txt',
    'criminal': 'Criminal_Law.txt',
    'civil': 'Civil_Law.txt', 
    'commercial': 'Commercial_Law.txt',
    'administrative': 'Administrative_Law.txt',
    'family': 'Family_Law.txt',
    'environmental': 'Environmental_Law.txt',
    'cyber': 'Cyber_Law.txt',
    'consumer': 'Consumer_Protection_Law.txt',
    'labour': 'Labour_and_Industrial_Law.txt'
};

// Get all constitution sections
router.get('/sections', async (req, res) => {
    try {
        const sections = Object.keys(SECTION_FILES).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1) + ' Law',
            apiKey: API_KEYS[key],
            fileName: SECTION_FILES[key]
        }));
        
        res.json({
            success: true,
            sections: sections
        });
    } catch (error) {
        console.error('Error getting sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get constitution sections'
        });
    }
});

// Get specific section content
// Get specific section content.
// Allows access if valid API key OR if authenticated user is enrolled in that section.
router.get('/section/:sectionId', optionalAuth, async (req, res) => {
    try {
        const { sectionId } = req.params;
        const apikey = req.headers['apikey'];

        // Check if section exists
        if (!SECTION_FILES[sectionId]) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Allow if API key matches (admin/service access)
        let allowed = false;
        if (apikey && API_KEYS[sectionId] === apikey) allowed = true;

        // If not allowed via apikey, check authenticated user's enrollment
        if (!allowed) {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Authentication required to access this section' });
            }

            // Check enrollment
            const existing = await Enrollment.findOne({ userId: req.user._id, sectionId: sectionId });
            if (!existing) {
                return res.status(403).json({ success: false, message: 'You must enroll in this course to access the content' });
            }
            allowed = true;
        }

        const filePath = path.join(__dirname, '..', 'constitution', SECTION_FILES[sectionId]);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Split content into paragraphs for better reading
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        
        res.json({
            success: true,
            section: {
                id: sectionId,
                title: sectionId.charAt(0).toUpperCase() + sectionId.slice(1) + ' Law',
                content: content,
                paragraphs: paragraphs,
                totalParagraphs: paragraphs.length
            }
        });
        
    } catch (error) {
        console.error('Error reading section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read section content'
        });
    }
});

// Search within a specific section
router.get('/section/:sectionId/search', async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { query, apikey } = req.query;
        
        // Validate API key
        if (!apikey || API_KEYS[sectionId] !== apikey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API key for this section'
            });
        }
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        
        const filePath = path.join(__dirname, '..', 'constitution', SECTION_FILES[sectionId]);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Simple search implementation
        const lines = content.split('\n');
        const matches = lines
            .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
            .filter(item => item.line.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 20); // Limit to 20 results
        
        res.json({
            success: true,
            query: query,
            section: sectionId,
            matches: matches,
            totalMatches: matches.length
        });
        
    } catch (error) {
        console.error('Error searching section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search section'
        });
    }
});

// Check enrollment status for current user
router.get('/enrolled/:sectionId', verifyToken, async (req, res) => {
    try {
        const { sectionId } = req.params;
        const enrollment = await Enrollment.findOne({ userId: req.user._id, sectionId: sectionId });
        res.json({ success: true, enrolled: !!enrollment });
    } catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({ success: false, message: 'Failed to check enrollment' });
    }
});

// Enroll current user in a section
router.post('/enroll/:sectionId', verifyToken, async (req, res) => {
    try {
        const { sectionId } = req.params;
        console.log('Enrollment request for user:', req.user._id, 'section:', sectionId);

        if (!SECTION_FILES[sectionId]) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        // Create enrollment if not exists
        const existing = await Enrollment.findOne({ userId: req.user._id, sectionId: sectionId });
        if (existing) {
            console.log('User already enrolled in section:', sectionId);
            return res.json({ success: true, message: 'Already enrolled', enrolled: true });
        }

        const enrollment = new Enrollment({ userId: req.user._id, sectionId });
        await enrollment.save();
        console.log('Enrollment created:', enrollment);

        // Create a notification for the user
        const note = new Notification({
            userId: req.user._id,
            title: `Enrolled in ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Law`,
            message: `You have successfully enrolled in the ${sectionId} course. Open My Courses to access it.`,
            metadata: { sectionId }
        });
        await note.save();

        // Also log an activity record in the existing activity collection (if desired)
        try {
            const db = mongoose.connection.db;
            await db.collection('user_activities').insertOne({
                userId: req.user._id,
                activityType: 'course_enroll',
                description: `Enrolled in ${sectionId}`,
                metadata: { sectionId },
                timestamp: new Date()
            });
        } catch (err) {
            console.warn('Failed to write to user_activities (non-fatal):', err.message || err);
        }

        res.json({ success: true, message: 'Enrollment successful', enrolled: true });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ success: false, message: 'Failed to enroll' });
    }
});

// Return current user's enrollments
router.get('/my-enrollments', verifyToken, async (req, res) => {
    try {
        console.log('Fetching enrollments for user:', req.user._id);
        const enrollments = await Enrollment.find({ userId: req.user._id }).lean();
        console.log('Found enrollments:', enrollments);
        res.json({ success: true, enrollments });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
    }
});

// Fetch notifications for current user
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const notes = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
        res.json({ success: true, notifications: notes });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Get API key for a section (admin only)
router.get('/apikey/:sectionId', async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        // TODO: Add admin authentication here
        
        if (!API_KEYS[sectionId]) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }
        
        res.json({
            success: true,
            section: sectionId,
            apiKey: API_KEYS[sectionId]
        });
        
    } catch (error) {
        console.error('Error getting API key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get API key'
        });
    }
});

module.exports = router;