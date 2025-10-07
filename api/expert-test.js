const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/expert-test', (req, res) => {
    console.log('🔥 Expert test endpoint hit!');
    res.json({ success: true, message: 'Expert API is working!' });
});

// Submit Expert Application (simple test version)
router.post('/expert-application', async (req, res) => {
    try {
        console.log('🔥 Expert application POST request received');
        console.log('🔍 Headers:', req.headers);
        console.log('📝 Body received:', req.body);
        
        // For testing - just return success
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

module.exports = router;