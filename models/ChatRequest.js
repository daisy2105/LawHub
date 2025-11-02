const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  createdAt: {
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

// Index for faster queries
chatRequestSchema.index({ userId: 1, expertId: 1 });
chatRequestSchema.index({ expertId: 1, status: 1 });
chatRequestSchema.index({ userId: 1, status: 1 });

// Prevent duplicate pending requests
chatRequestSchema.index(
  { userId: 1, expertId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

module.exports = ChatRequest;
