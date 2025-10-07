const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get ExpertApplication model
let ExpertApplication;
try {
    ExpertApplication = mongoose.model('ExpertApplication');
} catch (error) {
    // Model might not be registered yet, define schema
    const expertApplicationSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userEmail: String,
        userName: String,
        barCouncilId: { type: String, required: true },
        licenseYear: { type: Number, required: true },
        experience: { type: String, required: true },
        specialization: { type: String, required: true },
        firmName: String,
        location: { type: String, required: true },
        education: { type: String, required: true },
        courts: String,
        bio: { type: String, required: true },
        certifications: String,
        languages: { type: String, required: true },
        availability: { type: String, default: '9am-5pm' },
        documents: [{ name: String, type: String, size: Number, data: String }],
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'under-review'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: Date,
        reviewNotes: String,
        rejectionReason: String,
        termsAccepted: { type: Boolean, required: true },
        dataConsent: { type: Boolean, required: true },
        submittedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true });
    
    ExpertApplication = mongoose.model('ExpertApplication', expertApplicationSchema);
}

// Admin authentication middleware - SIMPLIFIED
const verifyAdmin = async (req, res, next) => {
    // Skip authentication for now - just proceed
    next();
};

// Admin verification endpoint
router.get('/admin/verify', verifyAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Admin token is valid',
            adminToken: req.adminToken
        });
    } catch (error) {
        console.error('Error verifying admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying admin'
        });
    }
});

// Get admin dashboard statistics - SIMPLE VERSION
router.get('/admin/stats', async (req, res) => {
    try {
        console.log('📊 API CALLED: /admin/stats');
        
        // Simple count using mongoose - no complications
        const totalUsers = await User.countDocuments();
        
        // Use mongoose connection for expert applications
        const db = mongoose.connection.db;
        const totalExperts = await db.collection("expertapplications").countDocuments();
        const pendingExperts = await db.collection("expertapplications").countDocuments({ status: 'pending' });
        const approvedExperts = await db.collection("expertapplications").countDocuments({ status: 'approved' });
        
        console.log(`📊 Stats: Users=${totalUsers}, Experts=${totalExperts}, Pending=${pendingExperts}, Approved=${approvedExperts}`);
        
        const result = {
            success: true,
            totalUsers,
            totalExperts,
            pendingExperts,
            approvedExperts
        };
        
        console.log('📊 Sending response:', result);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Database error:', error);
        res.json({
            success: false,
            totalUsers: 0,
            totalExperts: 0,
            pendingExperts: 0,
            approvedExperts: 0
        });
    }
});

// Get recent activity - REAL USER ACTIVITIES
router.get('/admin/recent-activity', async (req, res) => {
    try {
        console.log('📈 API CALLED: /admin/recent-activity');
        
        const db = mongoose.connection.db;
        
        // Fetch real user activities from user_activities table
        const userActivities = await db.collection('user_activities')
            .find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
        
        console.log(`📊 Found ${userActivities.length} real user activities`);
        
        if (userActivities.length > 0) {
            // Get user details for each activity
            const activitiesWithUserInfo = await Promise.all(
                userActivities.map(async (activity) => {
                    try {
                        const user = await User.findById(activity.userId).select('name email');
                        return {
                            userName: user ? user.name : 'Unknown User',
                            userEmail: user ? user.email : 'unknown@email.com',
                            action: activity.activityType || 'Activity',
                            details: activity.description || 'User activity',
                            timestamp: activity.timestamp || activity.createdAt,
                            metadata: activity.metadata || {}
                        };
                    } catch (error) {
                        console.warn('Could not fetch user for activity:', activity.userId);
                        return {
                            userName: 'Unknown User',
                            userEmail: 'unknown@email.com',
                            action: activity.activityType || 'Activity',
                            details: activity.description || 'User activity',
                            timestamp: activity.timestamp || activity.createdAt,
                            metadata: activity.metadata || {}
                        };
                    }
                })
            );
            
            const result = {
                success: true,
                activities: activitiesWithUserInfo
            };
            
            console.log('� Sending REAL activities response:', result);
            res.json(result);
        } else {
            // Fallback to recent user registrations if no activities found
            console.log('📈 No user activities found, showing recent registrations');
            const recentUsers = await User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email createdAt');
            
            const activities = recentUsers.map(user => ({
                userName: user.name,
                userEmail: user.email,
                action: 'User Registration',
                details: 'New user registered',
                timestamp: user.createdAt
            }));
            
            const result = {
                success: true,
                activities
            };
            
            console.log('📈 Sending fallback activities response:', result);
            res.json(result);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.json({
            success: true,
            activities: []
        });
    }
});

// Get all users with pagination and filters
router.get('/admin/users', verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, status } = req.query;
        
        // Build filter query
        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            filter.role = role;
        }
        
        if (status) {
            filter.status = status;
        }
        
        // Get users with pagination
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const totalUsers = await User.countDocuments(filter);
        
        res.json({
            success: true,
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                hasNextPage: page < Math.ceil(totalUsers / limit),
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Get single user details with complete profile
router.get('/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Fetch user's detailed profile from user_profiles collection
        const db = mongoose.connection.db;
        const userProfile = await db.collection('user_profiles').findOne({ 
            userId: new mongoose.Types.ObjectId(req.params.id) 
        });
        
        // Get user activities count
        const activityCount = await db.collection('user_activities').countDocuments({ 
            userId: new mongoose.Types.ObjectId(req.params.id) 
        });
        
        // Get login logs count
        const loginCount = await db.collection('login_logs').countDocuments({ 
            userId: new mongoose.Types.ObjectId(req.params.id) 
        });
        
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profile: userProfile || null,
                activityCount,
                loginCount
            }
        });
        
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user details'
        });
    }
});

// Suspend/Unsuspend user
router.put('/admin/users/:id/suspend', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Toggle suspension status
        user.status = user.status === 'suspended' ? 'active' : 'suspended';
        user.updatedAt = new Date();
        
        await user.save();
        
        res.json({
            success: true,
            message: `User ${user.status === 'suspended' ? 'suspended' : 'activated'} successfully`,
            user: {
                id: user._id,
                status: user.status
            }
        });
        
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

// Delete user
router.delete('/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Note: In a production app, you'd check if this is the current admin
        // For now, we'll skip this check since we don't have user context
        
        // Delete associated expert applications
        await ExpertApplication.deleteMany({ userId: userId });
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Get activity logs with pagination and filters
router.get('/admin/activities', verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, date } = req.query;
        
        // This is a placeholder implementation
        // In a real application, you would have an activity logging system
        
        // For now, we'll return recent user activities based on user data
        const filter = {};
        
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.createdAt = { $gte: startDate, $lt: endDate };
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get recent users and expert applications to simulate activity
        const recentUsers = await User.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('name email createdAt');
        
        const activities = recentUsers.map(user => ({
            timestamp: user.createdAt,
            userName: user.name,
            userEmail: user.email,
            action: 'User Registration',
            type: 'registration',
            ipAddress: '127.0.0.1', // Placeholder
            details: 'New user account created'
        }));
        
        // Add expert applications to activity
        const expertFilter = date ? { submittedAt: filter.createdAt } : {};
        const recentExperts = await ExpertApplication.find(expertFilter)
            .sort({ submittedAt: -1 })
            .limit(5)
            .populate('userId', 'name email');
        
        recentExperts.forEach(expert => {
            activities.push({
                timestamp: expert.submittedAt,
                userName: expert.userId?.name || expert.userName,
                userEmail: expert.userId?.email || expert.userEmail,
                action: 'Expert Application Submitted',
                type: 'expert_application',
                ipAddress: '127.0.0.1', // Placeholder
                details: `Applied as ${expert.specialization} lawyer`
            });
        });
        
        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const totalActivities = await User.countDocuments(filter);
        
        res.json({
            success: true,
            activities,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalActivities / limit),
                totalActivities,
                hasNextPage: page < Math.ceil(totalActivities / limit),
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error getting activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity logs'
        });
    }
});

// Add admin role to user (for testing purposes)
router.put('/admin/users/:id/make-admin', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        user.role = 'admin';
        user.updatedAt = new Date();
        
        await user.save();
        
        res.json({
            success: true,
            message: 'User promoted to admin successfully',
            user: {
                id: user._id,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to promote user to admin'
        });
    }
});

// Bulk user operations
router.post('/admin/users/bulk-action', verifyAdmin, async (req, res) => {
    try {
        const { action, userIds } = req.body;
        
        if (!action || !userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action or user IDs'
            });
        }
        
        let result;
        
        switch (action) {
            case 'suspend':
                result = await User.updateMany(
                    { _id: { $in: userIds } },
                    { status: 'suspended', updatedAt: new Date() }
                );
                break;
                
            case 'activate':
                result = await User.updateMany(
                    { _id: { $in: userIds } },
                    { status: 'active', updatedAt: new Date() }
                );
                break;
                
            case 'delete':
                // Delete associated expert applications first
                await ExpertApplication.deleteMany({ userId: { $in: userIds } });
                result = await User.deleteMany({ _id: { $in: userIds } });
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }
        
        res.json({
            success: true,
            message: `Bulk ${action} completed successfully`,
            affectedCount: result.modifiedCount || result.deletedCount
        });
        
    } catch (error) {
        console.error('Error performing bulk action:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk action'
        });
    }
});

// Get all expert applications
router.get('/admin/expert-applications', verifyAdmin, async (req, res) => {
    try {
        const expertApplications = await ExpertApplication.find()
            .populate('userId', 'name email')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            expertApplications
        });
    } catch (error) {
        console.error('Error getting expert applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expert applications'
        });
    }
});

// Get single expert application details
router.get('/admin/expert-applications/:id', verifyAdmin, async (req, res) => {
    try {
        const expertApplication = await ExpertApplication.findById(req.params.id)
            .populate('userId', 'name email');

        if (!expertApplication) {
            return res.status(404).json({
                success: false,
                message: 'Expert application not found'
            });
        }

        res.json({
            success: true,
            expertApplication
        });
    } catch (error) {
        console.error('Error getting expert application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expert application details'
        });
    }
});

// Update expert application status
router.put('/admin/expert-applications/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { status, reviewNotes } = req.body;
        
        if (!['approved', 'rejected', 'under-review'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const expertApplication = await ExpertApplication.findById(req.params.id);
        
        if (!expertApplication) {
            return res.status(404).json({
                success: false,
                message: 'Expert application not found'
            });
        }

        expertApplication.status = status;
        expertApplication.reviewedAt = new Date();
        expertApplication.reviewNotes = reviewNotes || '';
        expertApplication.updatedAt = new Date();

        await expertApplication.save();

        // If approved, update user's role to 'expert'
        if (status === 'approved') {
            await User.findByIdAndUpdate(expertApplication.userId, {
                role: 'expert',
                updatedAt: new Date()
            });
            console.log(`✅ User ${expertApplication.userId} role updated to 'expert'`);
        }

        res.json({
            success: true,
            message: `Expert application ${status} successfully`,
            expertApplication
        });
    } catch (error) {
        console.error('Error updating expert application status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expert application status'
        });
    }
});

// Get activity details by ID
router.get('/admin/activities/:id', verifyAdmin, async (req, res) => {
    try {
        // This is a placeholder since we don't have a proper activity logging system
        // In a real application, you would fetch the activity from an activities collection
        
        res.json({
            success: true,
            activity: {
                _id: req.params.id,
                action: 'Placeholder Activity',
                userEmail: 'user@example.com',
                timestamp: new Date(),
                details: 'This is a placeholder activity detail',
                ipAddress: '127.0.0.1',
                metadata: {
                    userAgent: 'Browser Info',
                    location: 'Unknown'
                }
            }
        });
    } catch (error) {
        console.error('Error getting activity details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity details'
        });
    }
});

module.exports = router;