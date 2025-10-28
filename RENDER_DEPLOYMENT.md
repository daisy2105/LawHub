# LawHub Render Deployment Guide

## 🚀 Deploying to lawhub-1.onrender.com

### Step 1: Prepare Repository
1. **Push your code** to GitHub repository: `Aairah146/LawHub`
2. **Ensure all files** are committed including:
   - `server.js`
   - `package.json`
   - `api/` folder with all endpoints
   - `models/` folder
   - `routes/` folder
   - `middleware/` folder

### Step 2: Render Dashboard Setup
1. **Login to Render**: https://render.com/
2. **Connect GitHub**: Link your `Aairah146/LawHub` repository
3. **Create Web Service**:
   - **Name**: `lawhub-1`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Step 3: Environment Variables in Render
Go to **Environment** tab and add these variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/[DATABASE]
JWT_SECRET=your-super-secure-jwt-secret-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
HF_API_KEY=your-huggingface-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
ALLOWED_ORIGINS=https://yourdomain.onrender.com
SESSION_SECRET=your-session-secret-key
BCRYPT_ROUNDS=12
CHAT_ENCRYPTION_KEY=your-32-character-encryption-key
```

### Step 4: Deploy
1. **Click Deploy** in Render dashboard
2. **Monitor logs** for successful deployment
3. **Wait for** collections to be auto-created in MongoDB

### Step 5: Test Deployment
After deployment, test these URLs:
- **Health Check**: https://lawhub-1.onrender.com/api/health
- **Home Page**: https://lawhub-1.onrender.com/
- **Dashboard**: https://lawhub-1.onrender.com/dashboard
- **RAG Search**: https://lawhub-1.onrender.com/api/rag/stats

## 📊 Auto-Created Collections

The following collections will be automatically created in your MongoDB:

### Core Collections
- `users` - User accounts with authentication
- `user_profiles` - Detailed user profile information
- `sessions` - Express session storage

### Expert System
- `expertapplications` - Expert verification applications
- `chatmessages` - Expert-user chat history
- `chatconnections` - Active chat connections

### Activity & Analytics
- `login_logs` - User login tracking
- `user_activities` - User activity logging
- `searchhistory` - Law search query history (for RAG system)

### Database Indexes (Auto-Created)
- User email uniqueness
- Profile completion status
- Expert application status
- Chat message timestamps
- Activity logging indexes

## 🔧 Production Optimizations

### Security
- CORS configured for your domain
- JWT secrets for production
- Encrypted chat messages
- Session security

### Performance
- Database connection pooling
- Proper error handling
- Rate limiting on APIs
- Optimized MongoDB indexes

### Monitoring
- Health check endpoint
- Database connection status
- RAG system status monitoring
- Error logging

## 🎯 Post-Deployment Tasks

### 1. Upload Constitution PDF
- Use the dashboard RAG section
- Upload Constitution of India PDF
- Process for vector embeddings

### 2. Create Admin User
- Register first user through signup
- Manually set as admin in MongoDB if needed

### 3. Test All Features
- User authentication
- Law search functionality
- RAG search system
- Expert application system
- Profile management

### 4. Monitor Performance
- Check Render logs
- Monitor MongoDB usage
- Watch Pinecone API usage
- Monitor Hugging Face API calls

## 🚨 Important Notes

- **Free Tier Limits**: Render free tier sleeps after 15 minutes of inactivity
- **First Load**: May take 30-60 seconds for cold start
- **Database**: MongoDB collections auto-create on first use
- **APIs**: All AI APIs have rate limits - monitor usage
- **Logs**: Check Render dashboard for deployment logs

Your LawHub application will be fully functional at `https://lawhub-1.onrender.com` after deployment! 🎉