/**
 * Chat API with Request-Accept Workflow and Encrypted Messages
 * Uses MongoDB Atlas for database storage
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lawhub-secret-key-2025';

// Encryption configuration
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'default-32-char-key-change-this!';
const ALGORITHM = 'aes-256-gcm';

// Ensure encryption key is 32 bytes
if (Buffer.from(ENCRYPTION_KEY, 'utf-8').length !== 32) {
    console.warn('⚠️  CHAT_ENCRYPTION_KEY should be exactly 32 characters for AES-256');
}

/**
 * Encrypt message using AES-256-GCM
 */
function encryptMessage(text) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Decrypt message using AES-256-GCM
 */
function decryptMessage(encryptedText, ivHex, authTagHex) {
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return '[Decryption failed]';
    }
}

/**
 * Authentication middleware - JWT based
 */
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization token provided' 
            });
        }

        const token = authHeader.substring(7);
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        req.user = decoded;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
}

// MongoDB Models
const ConnectionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    lawyerId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    requestMessage: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ConnectionSchema.index({ userId: 1 });
ConnectionSchema.index({ lawyerId: 1 });
ConnectionSchema.index({ status: 1 });
ConnectionSchema.index({ userId: 1, lawyerId: 1 });

const MessageSchema = new mongoose.Schema({
    connectionId: { type: String, required: true },
    senderId: { type: String, required: true },
    encryptedMessage: { type: String, required: true },
    encryptionIv: { type: String, required: true },
    encryptionAuthTag: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ connectionId: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ createdAt: 1 });
MessageSchema.index({ connectionId: 1, createdAt: 1 });

// Get or create models
let ChatConnection, ChatMessage;
try {
    ChatConnection = mongoose.model('ChatConnection');
    ChatMessage = mongoose.model('ChatMessage');
} catch {
    ChatConnection = mongoose.model('ChatConnection', ConnectionSchema);
    ChatMessage = mongoose.model('ChatMessage', MessageSchema);
}

/**
 * Send connection request to a lawyer
 */
router.post('/request-connection', authenticateUser, async (req, res) => {
    try {
        const { lawyerId, message } = req.body;
        const userId = req.userId;

        console.log(`💬 Connection request: ${userId} → ${lawyerId}`);

        // Check if connection already exists
        const existing = await ChatConnection.findOne({
            userId: userId,
            lawyerId: lawyerId
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Connection request already exists',
                status: existing.status
            });
        }

        // Create connection request
        const connection = await ChatConnection.create({
            userId: userId,
            lawyerId: lawyerId,
            status: 'pending',
            requestMessage: message || null
        });

        console.log('✅ Connection request created:', connection._id);

        res.json({
            success: true,
            message: 'Connection request sent successfully',
            connection: connection
        });
    } catch (error) {
        console.error('❌ Request connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send connection request'
        });
    }
});

/**
 * Get pending connection requests (for lawyers)
 */
router.get('/pending-requests', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const requests = await ChatConnection.find({
            lawyerId: userId,
            status: 'pending'
        }).sort({ createdAt: -1 });

        console.log(`📋 Found ${requests.length} pending requests for ${userId}`);

        res.json({
            success: true,
            requests: requests
        });
    } catch (error) {
        console.error('❌ Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending requests'
        });
    }
});

/**
 * Accept or reject connection request
 */
router.post('/respond-request/:connectionId', authenticateUser, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { action } = req.body; // 'accepted' or 'rejected'
        const userId = req.userId;

        console.log(`🔄 Responding to request ${connectionId}: ${action}`);

        // Verify this request is for this lawyer
        const connection = await ChatConnection.findOne({
            _id: connectionId,
            lawyerId: userId
        });

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection request not found'
            });
        }

        // Update connection status
        connection.status = action;
        connection.updatedAt = new Date();
        await connection.save();

        console.log('✅ Connection request updated');

        res.json({
            success: true,
            message: `Connection request ${action}`,
            connection: connection
        });
    } catch (error) {
        console.error('❌ Respond to request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to request'
        });
    }
});

/**
 * Get all accepted connections for current user
 */
router.get('/connections', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const connections = await ChatConnection.find({
            status: 'accepted',
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        }).sort({ updatedAt: -1 });

        // Only log if connections exist (reduce console spam)
        if (connections.length > 0) {
            console.log(`💬 ${connections.length} active connection(s) for ${userId}`);
        }

        res.json({
            success: true,
            connections: connections
        });
    } catch (error) {
        console.error('❌ Get connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get connections'
        });
    }
});

/**
 * Send encrypted message
 */
router.post('/send-message', authenticateUser, async (req, res) => {
    try {
        const { connectionId, message } = req.body;
        const userId = req.userId;

        console.log(`📨 Sending message in connection ${connectionId}`);

        // Verify user is part of this connection
        const connection = await ChatConnection.findOne({
            _id: connectionId,
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        });

        if (!connection || connection.status !== 'accepted') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this connection'
            });
        }

        // Encrypt message
        const { encrypted, iv, authTag } = encryptMessage(message);

        // Save message
        const chatMessage = await ChatMessage.create({
            connectionId: connectionId,
            senderId: userId,
            encryptedMessage: encrypted,
            encryptionIv: iv,
            encryptionAuthTag: authTag
        });

        console.log('✅ Message sent and encrypted:', chatMessage._id);

        res.json({
            success: true,
            message: 'Message sent successfully',
            messageId: chatMessage._id
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

/**
 * Get messages for a connection (decrypted)
 */
router.get('/messages/:connectionId', authenticateUser, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.userId;

        // Verify user is part of this connection
        const connection = await ChatConnection.findOne({
            _id: connectionId,
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these messages'
            });
        }

        // Get messages
        const messages = await ChatMessage.find({
            connectionId: connectionId
        }).sort({ createdAt: 1 });

        console.log(`📬 Retrieved ${messages.length} messages for connection ${connectionId}`);

        // Decrypt messages
        const decryptedMessages = messages.map(msg => ({
            id: msg._id,
            senderId: msg.senderId,
            message: decryptMessage(msg.encryptedMessage, msg.encryptionIv, msg.encryptionAuthTag),
            isRead: msg.isRead,
            createdAt: msg.createdAt
        }));

        res.json({
            success: true,
            messages: decryptedMessages
        });
    } catch (error) {
        console.error('❌ Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get messages'
        });
    }
});

/**
 * Get unread message count and pending requests count (for notification badge)
 */
router.get('/unread-count', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        // Get all connections for this user
        const connections = await ChatConnection.find({
            status: 'accepted',
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        }).select('_id');

        const connectionIds = connections.map(c => c._id.toString());

        // Count unread messages
        const unreadMessages = await ChatMessage.countDocuments({
            connectionId: { $in: connectionIds },
            isRead: false,
            senderId: { $ne: userId }
        });

        // Count pending requests (for lawyers/experts only)
        const pendingRequests = await ChatConnection.countDocuments({
            lawyerId: userId,
            status: 'pending'
        });

        const totalCount = unreadMessages + pendingRequests;

        console.log(`📬 Notification count for ${userId}: ${totalCount} (${unreadMessages} messages + ${pendingRequests} requests)`);

        res.json({
            success: true,
            unreadCount: unreadMessages,
            pendingRequests: pendingRequests,
            totalCount: totalCount
        });
    } catch (error) {
        console.error('❌ Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            unreadCount: 0,
            pendingRequests: 0,
            totalCount: 0
        });
    }
});

/**
 * Delete a chat connection and all its messages
 */
router.delete('/delete-connection/:connectionId', authenticateUser, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.userId;

        console.log(`🗑️ Deleting connection ${connectionId} by user ${userId}`);

        // Verify user is part of this connection
        const connection = await ChatConnection.findOne({
            _id: connectionId,
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        });

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found or you do not have permission to delete it'
            });
        }

        // Delete all messages in this connection
        const deletedMessages = await ChatMessage.deleteMany({
            connectionId: connectionId
        });

        console.log(`🗑️ Deleted ${deletedMessages.deletedCount} messages`);

        // Delete the connection itself
        await ChatConnection.deleteOne({ _id: connectionId });

        console.log('✅ Connection deleted successfully');

        res.json({
            success: true,
            message: 'Chat deleted successfully',
            deletedMessages: deletedMessages.deletedCount
        });
    } catch (error) {
        console.error('❌ Delete connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete chat'
        });
    }
});

/**
 * Mark messages as read
 */
router.post('/mark-read/:connectionId', authenticateUser, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.userId;

        console.log(`📖 Marking messages as read in connection ${connectionId}`);

        // Verify user is part of this connection
        const connection = await ChatConnection.findOne({
            _id: connectionId,
            $or: [
                { userId: userId },
                { lawyerId: userId }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to mark messages in this connection'
            });
        }

        // Mark all messages from other person as read
        const result = await ChatMessage.updateMany({
            connectionId: connectionId,
            senderId: { $ne: userId },
            isRead: false
        }, {
            $set: { isRead: true }
        });

        console.log(`✅ Marked ${result.modifiedCount} messages as read`);

        res.json({
            success: true,
            markedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
});

module.exports = router;
