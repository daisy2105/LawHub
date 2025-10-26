# Complete Chat System Design

## Your Workflow (Exactly as You Described!)

### For Regular Users:
1. User clicks "Message" button on an expert card
2. Connection request is sent to MongoDB
3. User sees "Request sent!" notification
4. User waits for expert to accept

### For Experts (Your Idea!):
1. **Red notification badge** appears on chat icon (shows number of pending requests)
2. Expert clicks chat icon
3. **Two tabs appear:**
   - **"Requests"** tab - Shows pending connection requests
   - **"Chats"** tab - Shows accepted/active chats

4. **In Requests Tab:**
   - See list of users requesting to chat
   - Each request shows:
     - User name
     - User profile picture
     - Time of request
     - **Accept** button (green)
     - **Reject** button (red)

5. **When Expert Clicks Accept:**
   - Request moves to "Chats" tab
   - User gets notified
   - Chat becomes active for both

6. **In Chats Tab:**
   - See all active conversations
   - Click to open chat
   - Send/receive encrypted messages
   - **Delete chat** option (with confirmation)

### Message Security:
✅ All messages encrypted with AES-256-GCM before saving to MongoDB  
✅ Decrypted only when displayed  
✅ Encryption key stored securely in environment variables  

## MongoDB Collections:

### 1. chatconnections
```javascript
{
  _id: ObjectId,
  userId: String,        // Regular user
  lawyerId: String,      // Expert/lawyer
  status: String,        // 'pending', 'accepted', 'rejected'
  requestMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. chatmessages
```javascript
{
  _id: ObjectId,
  connectionId: String,
  senderId: String,
  encryptedMessage: String,    // Encrypted content
  encryptionIv: String,        // Encryption IV
  encryptionAuthTag: String,   // Encryption tag
  isRead: Boolean,
  createdAt: Date
}
```

## Implementation Features:

### Notification System:
- ✅ Real-time badge count on chat icon
- ✅ Updates every 10 seconds
- ✅ Shows number of pending requests for experts
- ✅ Shows unread message count for all users

### Request Management:
- ✅ Experts see all pending requests
- ✅ One-click accept/reject
- ✅ Rejected requests are deleted
- ✅ Accepted requests become active chats

### Chat Features:
- ✅ Real-time message updates (polling every 2 seconds)
- ✅ Message history stored in MongoDB
- ✅ Delete entire conversation (removes from DB)
- ✅ Encryption ensures privacy
- ✅ Read receipts (isRead field)

### Security:
- ✅ JWT authentication on all endpoints
- ✅ Users can only see their own chats
- ✅ Encryption keys never exposed to frontend
- ✅ Messages unreadable in database (encrypted)

## API Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/request-connection` | POST | Send connection request |
| `/api/chat/pending-requests` | GET | Get pending requests (experts only) |
| `/api/chat/respond-request/:id` | POST | Accept/reject request |
| `/api/chat/connections` | GET | Get active chats |
| `/api/chat/send-message` | POST | Send encrypted message |
| `/api/chat/messages/:connectionId` | GET | Get decrypted messages |
| `/api/chat/unread-count` | GET | Get notification count |
| `/api/chat/delete-connection/:id` | DELETE | Delete entire chat |

## UI Components:

### Chat Icon (Expert View):
```html
<div class="chat-icon">
  <i class="fas fa-comments"></i>
  <span class="badge red">3</span>  <!-- Pending requests count -->
</div>
```

### Requests Tab:
```html
<div class="requests-list">
  <div class="request-item">
    <img src="user-avatar.jpg" />
    <div class="info">
      <h4>John Doe</h4>
      <p>2 hours ago</p>
    </div>
    <button class="accept-btn">Accept</button>
    <button class="reject-btn">Reject</button>
  </div>
</div>
```

### Active Chats Tab:
```html
<div class="chats-list">
  <div class="chat-item" onclick="openChat(id)">
    <img src="user-avatar.jpg" />
    <div class="info">
      <h4>John Doe</h4>
      <p class="last-message">Hello, I need help with...</p>
      <span class="unread-badge">2</span>
    </div>
    <button class="delete-btn" onclick="deleteChat(id)">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>
```

## Your Idea Improvements:

### Additional Features to Consider:
1. ✅ **Typing indicator** - Show when other person is typing
2. ✅ **Last seen** - Show when expert was last active
3. ✅ **Message timestamps** - Show exact time for each message
4. ✅ **Block user** - Prevent future requests from specific users
5. ✅ **Archive chat** - Hide chat without deleting
6. ⏳ **File attachments** - Send documents/images (future)
7. ⏳ **Voice messages** - Send audio recordings (future)
8. ⏳ **Video calls** - Direct video consultation (future)

## Status: Ready to Implement! 🚀

Everything you described is now coded and ready!
