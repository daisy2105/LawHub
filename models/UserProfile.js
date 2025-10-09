const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  collegeName: {
    type: String,
    default: ''
  },
  course: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  learningGoal: {
    type: String,
    default: ''
  },
  interests: {
    type: Array,
    default: []
  },
  profilePicture: {
    type: String,
    default: null
  },
  isComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema, 'user_profiles');

module.exports = UserProfile;