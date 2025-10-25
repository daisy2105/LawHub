# Chat System Deployment Checklist

## ✅ Before Deploying to Render

### 1. Add Environment Variable on Render
Go to your Render dashboard → Environment Variables and add:

```
CHAT_ENCRYPTION_KEY=8f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c
```

**Important:** Change this to your own secure 32-character key!

### 2. Verify .env Locally (for testing)
Make sure your local `.env` has:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=lawhub-secret-key-2025
CHAT_ENCRYPTION_KEY=8f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c
```

### 3. Files Ready for Deployment
✅ `api/chat.js` - MongoDB chat API  
✅ `chat-functionality.js` - Auto-detects environment  
✅ `modern-dashboard.html` - Chat UI integrated  
✅ `server.js` - Chat routes configured  

### 4. Auto-Environment Detection
The chat will automatically use:
- **Local:** `http://localhost:3000/api/chat`
- **Deployed:** `https://lawhub-1.onrender.com/api/chat`

No manual changes needed! 🎉

## 🚀 Deploy Steps

1. **Commit & Push to GitHub**
   ```powershell
   git add .
   git commit -m "Add encrypted chat system with MongoDB"
   git push origin feature/ashikafathima
   ```

2. **Add Environment Variable on Render**
   - Dashboard → lawhub service
   - Environment → Add Variable
   - Key: `CHAT_ENCRYPTION_KEY`
   - Value: `8f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c` (or your own)

3. **Deploy**
   - Render auto-deploys from GitHub
   - Or manually trigger deployment

4. **Test on Production**
   - Go to `https://lawhub-1.onrender.com`
   - Login
   - Click "Message" button
   - Check browser console for: `🔗 Chat API Base URL: https://lawhub-1.onrender.com/api/chat`

## 🧪 Testing

### Local Testing (Before Deploy)
```powershell
# Add encryption key to .env first
node server.js
# Open: http://localhost:3000/dashboard
# Console shows: http://localhost:3000/api/chat
```

### Production Testing (After Deploy)
```
# Open: https://lawhub-1.onrender.com
# Console shows: https://lawhub-1.onrender.com/api/chat
```

## 📊 Verify in MongoDB Atlas

After sending a message:
1. Go to MongoDB Atlas → Browse Collections
2. Check `chatconnections` collection - see pending/accepted connections
3. Check `chatmessages` collection - see encrypted messages

## 🔐 Security Reminder

**IMPORTANT:** The same encryption key must be used on both:
- ✅ Local development (`.env` file)
- ✅ Production (Render environment variables)

If keys don't match, messages encrypted locally won't decrypt in production!

## 🎯 What Works After Deployment

✅ Send connection requests  
✅ Accept/reject requests (when lawyer dashboard built)  
✅ Send encrypted messages  
✅ Retrieve decrypted messages  
✅ Real-time polling updates  
✅ Automatic environment detection  

---

**Status:** Ready to Deploy 🚀  
**URL:** https://lawhub-1.onrender.com  
**Database:** MongoDB Atlas (same as current)
