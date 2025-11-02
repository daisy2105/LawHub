const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['user', 'expert'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  encryptedKey: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
