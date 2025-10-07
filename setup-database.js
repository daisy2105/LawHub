// setup-database.js - Script to initialize MongoDB collections and indexes

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lawhub';

async function setupDatabase() {
    let client;
    
    try {
        console.log('Connecting to MongoDB...');
        client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
        const db = client.db();
        
        console.log('Connected successfully!');
        
        // Create collections if they don't exist
        const collections = ['users', 'user_profiles', 'login_logs', 'user_activities'];
        
        for (const collectionName of collections) {
            const exists = await db.listCollections({ name: collectionName }).hasNext();
            if (!exists) {
                await db.createCollection(collectionName);
                console.log(`Created collection: ${collectionName}`);
            } else {
                console.log(`Collection already exists: ${collectionName}`);
            }
        }
        
        // Create indexes for better performance
        console.log('Creating indexes...');
        
        // Users collection indexes
        try {
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            console.log('✓ Users email index created');
        } catch (error) {
            console.log('✓ Users email index already exists');
        }
        
        // User profiles indexes
        try {
            await db.collection('user_profiles').createIndex({ userId: 1 }, { unique: true });
            console.log('✓ User profiles userId index created');
        } catch (error) {
            console.log('✓ User profiles userId index already exists');
        }
        
        await db.collection('user_profiles').createIndex({ isComplete: 1 });
        await db.collection('user_profiles').createIndex({ status: 1 });
        await db.collection('user_profiles').createIndex({ city: 1 });
        console.log('✓ User profiles additional indexes created');
        
        // Login logs indexes
        await db.collection('login_logs').createIndex({ userId: 1 });
        await db.collection('login_logs').createIndex({ loginTime: -1 });
        await db.collection('login_logs').createIndex({ userId: 1, loginTime: -1 });
        console.log('✓ Login logs indexes created');
        
        // User activities indexes
        await db.collection('user_activities').createIndex({ userId: 1 });
        await db.collection('user_activities').createIndex({ timestamp: -1 });
        await db.collection('user_activities').createIndex({ activityType: 1 });
        await db.collection('user_activities').createIndex({ userId: 1, timestamp: -1 });
        await db.collection('user_activities').createIndex({ userId: 1, activityType: 1 });
        console.log('✓ User activities indexes created');
        
        // Insert sample data (optional)
        await insertSampleData(db);
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nCollections created:');
        console.log('- users (for authentication)');
        console.log('- user_profiles (for detailed user information)');
        console.log('- login_logs (for login/logout tracking)');
        console.log('- user_activities (for general activity tracking)');
        
        console.log('\nIndexes created for optimal performance');
        console.log('\nYou can now start your LawHub server!');
        
    } catch (error) {
        console.error('Database setup error:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('Database connection closed');
        }
    }
}

async function insertSampleData(db) {
    try {
        // Check if sample data already exists
        const userCount = await db.collection('users').countDocuments();
        
        if (userCount === 0) {
            console.log('Inserting sample user data...');
            
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('demo123', 10);
            
            // Insert sample user
            const sampleUser = await db.collection('users').insertOne({
                name: 'Demo User',
                email: 'demo@lawhub.com',
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // Insert sample profile
            await db.collection('user_profiles').insertOne({
                userId: sampleUser.insertedId,
                dateOfBirth: new Date('1995-01-15'),
                phone: '+91 9876543210',
                city: 'Mumbai',
                status: 'student',
                collegeName: 'Government Law College',
                course: 'B.A. LLB',
                learningGoal: 'exam-prep',
                interests: ['constitutional', 'criminal'],
                isComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('✓ Sample user created: demo@lawhub.com (password: demo123)');
        } else {
            console.log('Users already exist, skipping sample data insertion');
        }
    } catch (error) {
        console.error('Sample data insertion error:', error);
    }
}

// Run the setup
if (require.main === module) {
    setupDatabase().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = { setupDatabase };