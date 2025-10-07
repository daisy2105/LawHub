# MongoDB Database Schema for LawHub

## Collections Structure

### 1. users (existing collection)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. user_profiles (new collection)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  dateOfBirth: Date,
  phone: String,
  city: String,
  status: String, // 'student', 'employee', 'professional', 'other'
  
  // Education fields (for students)
  collegeName: String,
  course: String,
  
  // Work fields (for employees)
  companyName: String,
  designation: String,
  
  // Learning preferences
  learningGoal: String,
  interests: [String], // Array of interest areas
  
  // Profile picture
  profilePicture: String, // Base64 or file path
  
  // Metadata
  isComplete: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. login_logs (new collection)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  loginTime: Date,
  logoutTime: Date,
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  sessionDuration: Number, // in minutes
  createdAt: Date
}
```

### 4. user_activities (new collection)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  activityType: String, // 'login', 'profile_update', 'search', 'course_enroll', etc.
  description: String,
  metadata: Object, // Additional activity-specific data
  timestamp: Date,
  ipAddress: String
}
```

## API Endpoints to Create

### Profile Management
- `POST /api/profile/create` - Create user profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update user profile
- `DELETE /api/profile/:userId` - Delete user profile

### Login Activity
- `POST /api/activity/login` - Log user login
- `POST /api/activity/logout` - Log user logout
- `GET /api/activity/logs/:userId` - Get user login history
- `POST /api/activity/track` - Track general user activity

### Analytics
- `GET /api/analytics/user-stats/:userId` - Get user statistics
- `GET /api/analytics/login-patterns/:userId` - Get login patterns