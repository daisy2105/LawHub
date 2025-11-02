const express = require('express');
const router = express.Router();
const ChatRequest = require('../models/ChatRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Store user public keys in memory (in production, use database)
const publicKeys = new Map();

// Store typing status in memory (conversationId -> {userId, timestamp})
const typingStatus = new Map();

// ═══════════════════════════════════════════════════════════
// ENCRYPTION KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════

// POST /api/expert-chat/public-key - Upload user's public key
router.post('/public-key', verifyToken, async (req, res) => {
  try {
    const { publicKey } = req.body;
    const userId = req.user._id.toString();
    
    // Store public key (in production, save to database)
    publicKeys.set(userId, publicKey);
    
    res.json({
      success: true,
      message: 'Public key uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload public key',
      error: error.message
    });
  }
});

// GET /api/expert-chat/public-key/:userId - Get user's public key
router.get('/public-key/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const publicKey = publicKeys.get(userId);
    
    res.json({
      success: true,
      publicKey: publicKey || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get public key',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// USER ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /api/expert-chat/available-experts - Get all available experts
router.get('/available-experts', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching available experts...');
    
    // Find all approved experts from ExpertApplication collection
    const ExpertApplication = require('../models/ExpertApplication');
    const approvedExperts = await ExpertApplication.find({ status: 'approved' })
      .select('userId userName userEmail specialization experience location bio')
      .lean();
    
    console.log(`✅ Found ${approvedExperts.length} approved experts`);
    
    // Get request status for current user
    const userId = req.user._id;
    const userRequests = await ChatRequest.find({ 
      userId: userId,
      status: { $in: ['pending', 'accepted'] }
    }).select('expertId status').lean();
    
    // Create a map of expertId -> request status
    const requestStatusMap = {};
    userRequests.forEach(req => {
      requestStatusMap[req.expertId.toString()] = req.status;
    });
    
    // Enhance experts with request status
    const expertsWithStatus = approvedExperts.map(expert => ({
      id: expert._id,
      userId: expert.userId,
      name: expert.userName,
      email: expert.userEmail,
      specialization: expert.specialization,
      experience: expert.experience,
      location: expert.location,
      bio: expert.bio,
      profilePicture: '👨‍⚖️', // Default avatar
      rating: 4.5, // Default rating
      requestStatus: requestStatusMap[expert.userId.toString()] || 'none'
    }));
    
    res.json({
      success: true,
      experts: expertsWithStatus
    });
    
  } catch (error) {
    console.error('❌ Error fetching experts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available experts',
      error: error.message
    });
  }
});

// POST /api/expert-chat/request - Send chat request to expert
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { expertUserId, message = '' } = req.body;
    const userId = req.user._id;
    
    console.log(`📤 Chat request: User ${userId} → Expert ${expertUserId}`);
    
    if (!expertUserId) {
      return res.status(400).json({
        success: false,
        message: 'Expert ID is required'
      });
    }
    
    // Check if expert exists and is approved
    const ExpertApplication = require('../models/ExpertApplication');
    const expert = await ExpertApplication.findOne({
      userId: expertUserId,
      status: 'approved'
    });
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found or not approved'
      });
    }
    
    // Check for existing pending request
    const existingRequest = await ChatRequest.findOne({
      userId: userId,
      expertId: expertUserId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Request already sent. Please wait for expert to accept.',
        alreadyExists: true
      });
    }
    
    // Check for accepted request (active conversation)
    const acceptedRequest = await ChatRequest.findOne({
      userId: userId,
      expertId: expertUserId,
      status: 'accepted'
    });
    
    if (acceptedRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active conversation with this expert.',
        alreadyAccepted: true
      });
    }
    
    // Create new chat request
    const chatRequest = await ChatRequest.create({
      userId: userId,
      expertId: expertUserId,
      message: message,
      status: 'pending'
    });
    
    console.log('✅ Chat request created:', chatRequest._id);
    
    // Send notification to expert (if notification system exists)
    try {
      const Notification = require('../models/Notification');
      const user = await User.findById(userId);
      
      await Notification.create({
        userId: expertUserId,
        title: 'New Chat Request',
        message: `${user.name} wants to connect with you for legal consultation.`,
        metadata: {
          type: 'chat_request',
          requestId: chatRequest._id,
          userId: userId,
          userName: user.name
        }
      });
    } catch (err) {
      console.warn('⚠️ Could not send notification:', err.message);
    }
    
    res.json({
      success: true,
      message: 'Chat request sent successfully',
      request: {
        id: chatRequest._id,
        status: chatRequest.status,
        createdAt: chatRequest.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating chat request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send chat request',
      error: error.message
    });
  }
});

// GET /api/expert-chat/my-requests - Get user's sent requests with status
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const requests = await ChatRequest.find({ userId: userId })
      .populate('expertId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get expert details from ExpertApplication
    const ExpertApplication = require('../models/ExpertApplication');
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const expert = await ExpertApplication.findOne({ userId: request.expertId });
        return {
          id: request._id,
          expertId: request.expertId,
          expertName: expert?.userName || 'Unknown Expert',
          expertSpecialization: expert?.specialization || 'Legal Expert',
          status: request.status,
          message: request.message,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        };
      })
    );
    
    res.json({
      success: true,
      requests: requestsWithDetails
    });
    
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
});

// GET /api/expert-chat/active-conversations - Get user's active conversations
router.get('/active-conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.query.role || 'user'; // 'user' or 'expert'
    
    console.log(`📱 Fetching active conversations for ${userRole}: ${userId}`);
    
    const query = userRole === 'expert' 
      ? { expertId: userId, status: 'active' }
      : { userId: userId, status: 'active' };
    
    const conversations = await Conversation.find(query)
      .sort({ lastMessageTime: -1 })
      .lean();
    
    console.log(`Found ${conversations.length} conversations`);
    
    // Get details for each conversation
    const ExpertApplication = require('../models/ExpertApplication');
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = userRole === 'expert' ? conv.userId : conv.expertId;
        const otherUser = await User.findById(otherUserId).select('name email').lean();
        
        // Get expert details if user is viewing
        let expertDetails = null;
        if (userRole === 'user') {
          expertDetails = await ExpertApplication.findOne({ userId: conv.expertId }).lean();
        } else {
          expertDetails = await ExpertApplication.findOne({ userId: conv.expertId }).lean();
        }
        
        return {
          id: conv._id,
          userId: conv.userId,
          expertId: conv.expertId,
          otherUserName: userRole === 'expert' ? (otherUser?.name || 'User') : (expertDetails?.userName || 'Expert'),
          otherUserEmail: otherUser?.email,
          specialization: expertDetails?.specialization || 'Legal Expert',
          lastMessage: conv.lastMessage || 'No messages yet',
          lastMessageTime: conv.lastMessageTime,
          unreadCount: userRole === 'expert' ? conv.unreadCountExpert : conv.unreadCountUser,
          status: conv.status,
          createdAt: conv.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      conversations: conversationsWithDetails
    });
    
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// EXPERT ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /api/expert-chat/pending-requests - Get pending requests for expert
router.get('/pending-requests', verifyToken, async (req, res) => {
  try {
    const expertUserId = req.user._id;
    
    console.log(`📥 Fetching pending requests for expert: ${expertUserId}`);
    
    const requests = await ChatRequest.find({
      expertId: expertUserId,
      status: 'pending'
    })
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`Found ${requests.length} pending requests`);
    
    // Get user details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const user = await User.findById(request.userId).select('name email').lean();
        return {
          id: request._id,
          userId: request.userId,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          message: request.message,
          status: request.status,
          createdAt: request.createdAt
        };
      })
    );
    
    res.json({
      success: true,
      requests: requestsWithDetails
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
});

// POST /api/expert-chat/request/:requestId/accept - Accept chat request
router.post('/request/:requestId/accept', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const expertUserId = req.user._id;
    
    console.log(`✅ Expert ${expertUserId} accepting request ${requestId}`);
    
    // Find the request
    const request = await ChatRequest.findOne({
      _id: requestId,
      expertId: expertUserId,
      status: 'pending'
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }
    
    // Update request status
    request.status = 'accepted';
    request.updatedAt = new Date();
    await request.save();
    
    // Create conversation
    const conversation = await Conversation.create({
      userId: request.userId,
      expertId: expertUserId,
      requestId: requestId,
      status: 'active',
      lastMessage: 'Conversation started',
      lastMessageTime: new Date()
    });
    
    console.log('✅ Conversation created:', conversation._id);
    
    // Send notification to user
    try {
      const Notification = require('../models/Notification');
      const expert = await User.findById(expertUserId);
      
      await Notification.create({
        userId: request.userId,
        title: 'Chat Request Accepted',
        message: `Your chat request has been accepted. You can now chat with the expert.`,
        metadata: {
          type: 'chat_accepted',
          conversationId: conversation._id,
          expertId: expertUserId
        }
      });
    } catch (err) {
      console.warn('⚠️ Could not send notification:', err.message);
    }
    
    res.json({
      success: true,
      message: 'Chat request accepted successfully',
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        expertId: conversation.expertId
      }
    });
    
  } catch (error) {
    console.error('❌ Error accepting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept chat request',
      error: error.message
    });
  }
});

// POST /api/expert-chat/request/:requestId/reject - Reject chat request
router.post('/request/:requestId/reject', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const expertUserId = req.user._id;
    const { reason = '' } = req.body;
    
    console.log(`❌ Expert ${expertUserId} rejecting request ${requestId}`);
    
    // Find the request
    const request = await ChatRequest.findOne({
      _id: requestId,
      expertId: expertUserId,
      status: 'pending'
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }
    
    // Update request status
    request.status = 'rejected';
    request.updatedAt = new Date();
    await request.save();
    
    // Send notification to user
    try {
      const Notification = require('../models/Notification');
      
      await Notification.create({
        userId: request.userId,
        title: 'Chat Request Declined',
        message: `Your chat request has been declined.${reason ? ' Reason: ' + reason : ''}`,
        metadata: {
          type: 'chat_rejected',
          requestId: requestId
        }
      });
    } catch (err) {
      console.warn('⚠️ Could not send notification:', err.message);
    }
    
    res.json({
      success: true,
      message: 'Chat request rejected successfully'
    });
    
  } catch (error) {
    console.error('❌ Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject chat request',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// MESSAGING ENDPOINTS (Both User and Expert)
// ═══════════════════════════════════════════════════════════

// GET /api/expert-chat/conversation/:conversationId/messages - Get messages
router.get('/conversation/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ userId: userId }, { expertId: userId }],
      status: 'active'
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access'
      });
    }
    
    // Get messages
    const messages = await Message.find({ conversationId: conversationId })
      .sort({ timestamp: 1 })
      .lean();
    
    // Mark messages as read
    const userRole = conversation.userId.toString() === userId.toString() ? 'user' : 'expert';
    await Message.updateMany(
      {
        conversationId: conversationId,
        senderId: { $ne: userId },
        isRead: false
      },
      { isRead: true }
    );
    
    // Reset unread count
    if (userRole === 'user') {
      conversation.unreadCountUser = 0;
    } else {
      conversation.unreadCountExpert = 0;
    }
    await conversation.save();
    
    res.json({
      success: true,
      messages: messages,
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        expertId: conversation.expertId
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// POST /api/expert-chat/conversation/:conversationId/message - Send message
router.post('/conversation/:conversationId/message', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, encryptedKey } = req.body;
    const userId = req.user._id;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      $or: [{ userId: userId }, { expertId: userId }],
      status: 'active'
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access'
      });
    }
    
    // Determine sender role
    const senderRole = conversation.userId.toString() === userId.toString() ? 'user' : 'expert';
    
    // Create message (store encrypted message)
    const newMessage = await Message.create({
      conversationId: conversationId,
      senderId: userId,
      senderRole: senderRole,
      message: message.trim(),  // This is the encrypted message
      encryptedKey: encryptedKey || '',  // Store the encrypted AES key
      isRead: false,
      timestamp: new Date()
    });
    
    // Update conversation (store first 50 chars of encrypted message as preview)
    conversation.lastMessage = message.trim().substring(0, 50);
    conversation.lastMessageTime = new Date();
    
    // Increment unread count for the other party
    if (senderRole === 'user') {
      conversation.unreadCountExpert += 1;
    } else {
      conversation.unreadCountUser += 1;
    }
    
    await conversation.save();
    
    console.log('✅ Encrypted message sent:', newMessage._id);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageData: {
        id: newMessage._id,
        message: newMessage.message,
        encryptedKey: newMessage.encryptedKey,
        timestamp: newMessage.timestamp,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE MESSAGE
// ═══════════════════════════════════════════════════════════

// DELETE /api/expert-chat/message/:messageId - Delete a message
router.delete('/message/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Verify user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    // Update conversation's last message if this was the last one
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const lastMessage = await Message.findOne({ conversationId: message.conversationId })
        .sort({ timestamp: -1 })
        .limit(1);
      
      if (lastMessage) {
        conversation.lastMessage = lastMessage.message.substring(0, 50);
        conversation.lastMessageTime = lastMessage.timestamp;
      } else {
        conversation.lastMessage = '';
        conversation.lastMessageTime = null;
      }
      
      await conversation.save();
    }
    
    console.log('✅ Message deleted:', messageId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════════════════════════

// POST /api/expert-chat/conversation/:conversationId/typing - Update typing status
router.post('/conversation/:conversationId/typing', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { typing } = req.body;
    const userId = req.user._id.toString();
    
    if (typing) {
      // User is typing
      typingStatus.set(conversationId, {
        userId: userId,
        timestamp: Date.now()
      });
    } else {
      // User stopped typing
      typingStatus.delete(conversationId);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expert-chat/conversation/:conversationId/typing - Get typing status
router.get('/conversation/:conversationId/typing', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const status = typingStatus.get(conversationId);
    
    // Clear old typing status (older than 5 seconds)
    if (status && (Date.now() - status.timestamp > 5000)) {
      typingStatus.delete(conversationId);
      return res.json({ isTyping: false });
    }
    
    res.json({
      isTyping: !!status,
      userId: status?.userId || null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// READ RECEIPTS
// ═══════════════════════════════════════════════════════════

// POST /api/expert-chat/conversation/:conversationId/read - Mark messages as read
router.post('/conversation/:conversationId/read', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    // Mark all messages in this conversation as read (for messages NOT sent by current user)
    await Message.updateMany(
      {
        conversationId: conversationId,
        senderId: { $ne: userId },
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
