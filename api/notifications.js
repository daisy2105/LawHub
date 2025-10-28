const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'lawhub-secret-key-2025';

// Use existing models
const Notification = require('../models/Notification');

// Connection Request Schema
const ConnectionRequestSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    expertId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    message: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    chatSessionId: { type: String }
});

ConnectionRequestSchema.index({ userId: 1 });
ConnectionRequestSchema.index({ expertId: 1 });
ConnectionRequestSchema.index({ status: 1 });

let ConnectionRequest;
try {
    ConnectionRequest = mongoose.model('ConnectionRequest');
} catch {
    ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema);
}

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

// Helper function to send notification
async function sendNotification(userId, title, message, metadata = {}) {
    try {
        const notification = await Notification.create({
            userId: userId,
            title: title,
            message: message,
            metadata: metadata
        });
        
        console.log(`📢 Notification sent to user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return null;
    }
}

// POST /api/notifications/connection-request - Send connection request
router.post('/connection-request', authenticateUser, async (req, res) => {
    try {
        const { expertId, message = '' } = req.body;
        const userId = req.user.userId || req.user.id;

        console.log(`📞 Connection request: User ${userId} → Expert ${expertId}`);

        // Check if there's already a pending request
        const existingRequest = await ConnectionRequest.findOne({
            userId: userId,
            expertId: expertId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request with this expert'
            });
        }

        // Get user and expert info
        const User = require('../models/User');
        const ExpertApplication = require('../models/ExpertApplication');
        
        const user = await User.findById(userId);
        const expert = await ExpertApplication.findById(expertId);

        if (!expert || expert.status !== 'approved') {
            return res.status(404).json({
                success: false,
                message: 'Expert not found or not approved'
            });
        }

        // Create connection request
        const connectionRequest = await ConnectionRequest.create({
            userId: userId,
            expertId: expertId,
            message: message,
            chatSessionId: `chat_${userId}_${expertId}_${Date.now()}`
        });

        // Send notification to expert
        await sendNotification(
            expert.userId, // Expert's user ID
            'New Connection Request',
            `${user.email} wants to connect with you for legal consultation.${message ? ' Message: ' + message : ''}`,
            {
                type: 'connection_request',
                connectionRequestId: connectionRequest._id,
                userId: userId,
                userEmail: user.email,
                expertId: expertId,
                message: message,
                actionUrl: `/expert/requests/${connectionRequest._id}`
            }
        );

        console.log('✅ Connection request created and expert notified');

        res.json({
            success: true,
            message: 'Connection request sent successfully. The expert will be notified.',
            requestId: connectionRequest._id,
            chatSessionId: connectionRequest.chatSessionId
        });

    } catch (error) {
        console.error('❌ Error creating connection request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send connection request',
            error: error.message
        });
    }
});

// POST /api/notifications/respond-request - Expert responds to connection request
router.post('/respond-request', authenticateUser, async (req, res) => {
    try {
        const { requestId, action } = req.body; // action: 'accepted' or 'rejected'
        const expertUserId = req.user.userId || req.user.id;

        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "accepted" or "rejected"'
            });
        }

        // Find the connection request
        const connectionRequest = await ConnectionRequest.findById(requestId);
        
        if (!connectionRequest || connectionRequest.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Connection request not found or already processed'
            });
        }

        // Verify expert ownership
        const ExpertApplication = require('../models/ExpertApplication');
        const expert = await ExpertApplication.findOne({
            _id: connectionRequest.expertId,
            userId: expertUserId,
            status: 'approved'
        });

        if (!expert) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to respond to this request'
            });
        }

        // Update connection request
        connectionRequest.status = action;
        connectionRequest.respondedAt = new Date();
        await connectionRequest.save();

        // Get user info for notification
        const User = require('../models/User');
        const user = await User.findById(connectionRequest.userId);

        // Send notification to user
        const notificationTitle = action === 'accepted' ? 'Connection Request Accepted' : 'Connection Request Declined';
        const notificationMessage = action === 'accepted' 
            ? `${expert.userName || 'Legal Expert'} has accepted your connection request. You can now start chatting!`
            : `${expert.userName || 'Legal Expert'} has declined your connection request.`;

        await sendNotification(
            connectionRequest.userId,
            notificationTitle,
            notificationMessage,
            {
                type: `connection_${action}`,
                connectionRequestId: requestId,
                expertId: connectionRequest.expertId,
                expertName: expert.userName,
                chatSessionId: connectionRequest.chatSessionId,
                actionUrl: action === 'accepted' ? `/chat/${connectionRequest.chatSessionId}` : null
            }
        );

        console.log(`✅ Expert ${action} connection request ${requestId}`);

        res.json({
            success: true,
            message: `Connection request ${action} successfully`,
            status: connectionRequest.status,
            chatSessionId: connectionRequest.chatSessionId
        });

    } catch (error) {
        console.error('❌ Error responding to connection request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to connection request'
        });
    }
});

// GET /api/notifications - Get notifications for current user
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        const query = { userId: userId };
        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        const unreadCount = await Notification.countDocuments({
            userId: userId,
            read: false
        });

        res.json({
            success: true,
            notifications: notifications,
            unreadCount: unreadCount
        });

    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// GET /api/notifications/connection-requests - Get pending connection requests (for experts)
router.get('/connection-requests', authenticateUser, async (req, res) => {
    try {
        const expertUserId = req.user.userId || req.user.id;

        // Find expert application for this user
        const ExpertApplication = require('../models/ExpertApplication');
        const expertApp = await ExpertApplication.findOne({ 
            userId: expertUserId, 
            status: 'approved' 
        });

        if (!expertApp) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized as expert'
            });
        }

        const requests = await ConnectionRequest.find({
            expertId: expertApp._id.toString(),
            status: 'pending'
        }).sort({ requestedAt: -1 });

        // Get user details for each request
        const User = require('../models/User');
        const requestsWithUserInfo = await Promise.all(
            requests.map(async (req) => {
                const user = await User.findById(req.userId);
                return {
                    id: req._id,
                    userId: req.userId,
                    userEmail: user ? user.email : 'Unknown',
                    userName: user ? (user.name || user.email) : 'Unknown User',
                    message: req.message,
                    requestedAt: req.requestedAt,
                    chatSessionId: req.chatSessionId
                };
            })
        );

        res.json({
            success: true,
            requests: requestsWithUserInfo
        });

    } catch (error) {
        console.error('❌ Error fetching connection requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch connection requests'
        });
    }
});

// POST /api/notifications/mark-read - Mark notifications as read
router.post('/mark-read', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { notificationIds = [] } = req.body;

        if (notificationIds.length === 0) {
            // Mark all notifications as read
            const result = await Notification.updateMany(
                { userId: userId, read: false },
                { read: true }
            );
            
            res.json({
                success: true,
                message: 'All notifications marked as read',
                markedCount: result.modifiedCount
            });
        } else {
            // Mark specific notifications as read
            const result = await Notification.updateMany(
                { 
                    _id: { $in: notificationIds },
                    userId: userId,
                    read: false 
                },
                { read: true }
            );
            
            res.json({
                success: true,
                message: 'Notifications marked as read',
                markedCount: result.modifiedCount
            });
        }

    } catch (error) {
        console.error('❌ Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        
        const unreadCount = await Notification.countDocuments({
            userId: userId,
            read: false
        });

        res.json({
            success: true,
            unreadCount: unreadCount
        });

    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            unreadCount: 0
        });
    }
});

module.exports = router;