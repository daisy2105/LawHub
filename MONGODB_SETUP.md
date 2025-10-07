# LawHub MongoDB Setup Guide

## 🚀 Quick Start Instructions

### Prerequisites
✅ You already have MongoDB Compass installed
✅ MongoDB server should be running locally

### Step 1: Install Node.js Dependencies
Open your terminal in the project folder and run:

```bash
npm install
```

This will install all required packages:
- express (web server)
- mongoose (MongoDB connection)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- express-validator (input validation)

### Step 2: Start MongoDB Service
Make sure MongoDB is running. You can:
1. Start MongoDB service from Windows Services
2. Or run `mongod` command in terminal
3. Verify connection in MongoDB Compass at `mongodb://localhost:27017`

### Step 3: Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 4: Access Your Application
- **Home Page**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup
- **Dashboard**: http://localhost:3000/dashboard

### Database Information
- **Database Name**: lawhub
- **Collection**: users
- **Connection**: mongodb://localhost:27017/lawhub

### Testing the Authentication
1. Go to http://localhost:3000/signup
2. Create a new account
3. Login with your credentials
4. Access the dashboard

### Viewing Database in MongoDB Compass
1. Open MongoDB Compass
2. Connect to: mongodb://localhost:27017
3. You'll see "lawhub" database
4. Click on "users" collection to see registered users

### API Endpoints Available
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/users` - List all users (for testing)

### Troubleshooting
1. **MongoDB Connection Error**: Make sure MongoDB service is running
2. **Port 3000 in use**: Change PORT in .env file
3. **Dependencies missing**: Run `npm install` again

## 🔒 Security Features
- Password hashing with bcrypt
- JWT token authentication
- Input validation
- Protected routes
- Secure user sessions

Ready to test! 🎉