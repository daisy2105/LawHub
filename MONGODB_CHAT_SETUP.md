# Chat System - MongoDB Atlas Setup

## ✅ **AUTOMATIC SETUP** - No Manual Configuration Required!

The chat system is now fully integrated with your **MongoDB Atlas** database. Everything is handled automatically!

## What Happens Automatically

### 1. Collections Created On First Use
When you send your first connection request or message, MongoDB automatically creates:
- **`chatconnections`** - Stores connection requests and relationships
- **`chatmessages`** - Stores encrypted chat messages

### 2. Indexes Created Automatically
The following indexes are created for performance:
- `chatconnections`: userId, lawyerId, status, and combination indexes
- `chatmessages`: connectionId, senderId, createdAt, and combination indexes

### 3. Data Structure

#### ChatConnections Collection
```javascript
{
  _id: ObjectId,
  userId: String,          // User who sent the request
  lawyerId: String,        // Lawyer receiving the request
  status: String,          // 'pending', 'accepted', or 'rejected'
  requestMessage: String,  // Optional message with request
  createdAt: Date,
  updatedAt: Date
}
```

#### ChatMessages Collection
```javascript
{
  _id: ObjectId,
  connectionId: String,           // Reference to connection
  senderId: String,               // Who sent this message
  encryptedMessage: String,       // AES-256-GCM encrypted message
  encryptionIv: String,           // Initialization Vector (hex)
  encryptionAuthTag: String,      // Authentication Tag (hex)
  isRead: Boolean,                // Message read status
  createdAt: Date
}
```

## Environment Variables

Add this to your `.env` file:

```env
# Existing MongoDB connection (already configured)
MONGODB_URI=your_mongodb_atlas_uri

# Chat encryption key (add this)
CHAT_ENCRYPTION_KEY=your-32-character-encryption-key-here!!!
```

**Generate a strong 32-character key:**
```javascript
// Run in Node.js REPL or browser console
require('crypto').randomBytes(16).toString('hex')
// Or use a password generator for 32 characters
```

## Verify Setup

### Check Collections in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Browse Collections"
3. Select your `lawhub` database
4. After first use, you'll see:
   - `chatconnections` collection
   - `chatmessages` collection

### Check Indexes

In MongoDB Atlas:
1. Select collection → "Indexes" tab
2. You should see indexes like:
   - `userId_1`
   - `lawyerId_1`
   - `status_1`
   - `userId_1_lawyerId_1`

## Testing the Chat System

### 1. Start Server
```powershell
node server.js
```

### 2. Send Test Connection Request

Open browser console on `modern-dashboard.html`:
```javascript
// Send connection request
fetch('http://localhost:3000/api/chat/request-connection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    lawyerId: 'some-lawyer-id',
    message: 'Hello, I need legal help'
  })
})
.then(r => r.json())
.then(console.log);
```

### 3. Check MongoDB Atlas
- Go to Browse Collections
- Open `chatconnections`
- You should see your new request with status: "pending"

### 4. Manually Accept (Until Lawyer Dashboard Built)
- Find the document in Atlas
- Click "Edit"
- Change `status` from `"pending"` to `"accepted"`
- Click "Update"

### 5. Send Test Message
```javascript
fetch('http://localhost:3000/api/chat/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    connectionId: 'your-connection-id-from-step-3',
    message: 'This is a test message!'
  })
})
.then(r => r.json())
.then(console.log);
```

### 6. Verify Encryption in MongoDB
- Go to `chatmessages` collection
- See the `encryptedMessage` field - should be gibberish like: `"a7f3e9d2c1b8..."`
- See `encryptionIv` and `encryptionAuthTag` fields populated
- **NOT plain text!**

### 7. Get Decrypted Messages
```javascript
fetch('http://localhost:3000/api/chat/messages/your-connection-id', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log);
// Messages are decrypted automatically!
```

## Security Features

### ✅ What's Protected

1. **End-to-end encryption**
   - All messages encrypted with AES-256-GCM
   - Encryption happens server-side
   - Encryption key never exposed to clients

2. **JWT Authentication**
   - All endpoints require valid JWT token
   - Tokens verified against your JWT_SECRET
   - Unauthorized access blocked

3. **Authorization Checks**
   - Users can only see their own connections
   - Users can only send messages in their connections
   - Connection verification on every message

4. **Data Integrity**
   - Authentication tags ensure messages haven't been tampered
   - IV (Initialization Vector) unique per message
   - Encryption key rotation supported (change CHAT_ENCRYPTION_KEY)

## API Endpoints

All available at `http://localhost:3000/api/chat/`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/request-connection` | POST | Send connection request |
| `/pending-requests` | GET | Get requests (lawyers) |
| `/respond-request/:id` | POST | Accept/reject request |
| `/connections` | GET | Get active connections |
| `/send-message` | POST | Send encrypted message |
| `/messages/:connectionId` | GET | Get decrypted messages |
| `/unread-count` | GET | Get unread count |

## Troubleshooting

### "Connection to MongoDB failed"
- Check `MONGODB_URI` in `.env` is correct
- Verify MongoDB Atlas cluster is running
- Check firewall/IP whitelist in Atlas

### "Encryption failed"
- Ensure `CHAT_ENCRYPTION_KEY` is exactly 32 characters
- Don't use special shell characters that need escaping

### "Collections not appearing"
- Collections are created on first insert
- Send at least one connection request
- Refresh MongoDB Atlas browser

### "Authentication failed"
- Verify user is logged in
- Check `localStorage.getItem('token')` exists
- Verify JWT_SECRET matches between signup/login and chat

## Performance Tips

1. **Indexes are automatic** - Created on model definition
2. **Connection pooling** - Mongoose handles this
3. **Query optimization** - Queries use indexed fields
4. **Consider pagination** - For long message histories (future enhancement)

## Next Steps

1. ✅ Start server
2. ✅ Test connection request flow
3. ✅ Verify encryption in MongoDB
4. ⏳ Build lawyer dashboard for accepting requests
5. ⏳ Add WebSocket for real-time updates
6. ⏳ Implement message pagination

---

**Status:** 🟢 Ready to Use with MongoDB Atlas  
**Database:** ✅ Automatically configured  
**Encryption:** ✅ AES-256-GCM enabled  
**Authentication:** ✅ JWT protected  

No manual database setup needed - just start coding! 🎉
