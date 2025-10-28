require('dotenv').config();
const mongoose = require('mongoose');

async function checkExperts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const experts = await db.collection('expertapplications').find({}).toArray();
    
    console.log('\n=== EXPERT APPLICATIONS ===');
    console.log('Total applications:', experts.length);
    
    if (experts.length > 0) {
      experts.forEach((expert, i) => {
        console.log(`\nExpert ${i + 1}:`);
        console.log('  ID:', expert._id);
        console.log('  Name:', expert.name || expert.fullName || expert.userName || 'N/A');
        console.log('  Email:', expert.email || expert.userEmail || 'N/A');
        console.log('  Status:', expert.status);
        console.log('  Specialization:', expert.specialization || expert.expertise || 'N/A');
        console.log('  Experience:', expert.experience || expert.yearsOfExperience || 'N/A');
        console.log('  Location:', expert.location || 'N/A');
      });
      
      const approved = experts.filter(e => e.status === 'approved');
      console.log(`\n✅ Approved experts: ${approved.length}`);
      const pending = experts.filter(e => e.status === 'pending');
      console.log(`⏳ Pending experts: ${pending.length}`);
      
      if (approved.length === 0) {
        console.log('\n🔧 Creating sample approved expert...');
        
        const sampleExpert = {
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@lawfirm.com',
          specialization: 'Constitutional Law',
          experience: 15,
          location: 'New Delhi',
          status: 'approved',
          bio: 'Experienced constitutional lawyer with 15+ years of practice in Supreme Court',
          barCouncilId: 'BAR12345',
          licenseYear: 2008,
          firmName: 'Kumar & Associates',
          courts: 'Supreme Court, Delhi High Court',
          languages: 'English, Hindi',
          availability: '9am-6pm',
          termsAccepted: true,
          dataConsent: true,
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewNotes: 'Auto-approved sample expert'
        };
        
        const result = await db.collection('expertapplications').insertOne(sampleExpert);
        console.log('✅ Sample expert created with ID:', result.insertedId);
      }
    } else {
      console.log('No expert applications found. Creating sample data...');
      
      const sampleExperts = [
        {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@legaltech.com',
          specialization: 'Criminal Law',
          experience: 12,
          location: 'Mumbai',
          status: 'approved',
          bio: 'Criminal law specialist with extensive courtroom experience',
          barCouncilId: 'BAR67890',
          licenseYear: 2011,
          firmName: 'Sharma Legal Associates',
          courts: 'Bombay High Court, Sessions Court',
          languages: 'English, Hindi, Marathi',
          availability: '10am-7pm',
          termsAccepted: true,
          dataConsent: true,
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewNotes: 'Auto-approved sample expert'
        },
        {
          name: 'Adv. Suresh Patel',
          email: 'suresh.patel@civillaw.org',
          specialization: 'Civil Law',
          experience: 8,
          location: 'Ahmedabad',
          status: 'approved',
          bio: 'Civil litigation expert specializing in property disputes',
          barCouncilId: 'BAR11223',
          licenseYear: 2015,
          firmName: 'Patel & Co.',
          courts: 'Gujarat High Court, District Court',
          languages: 'English, Hindi, Gujarati',
          availability: '9am-5pm',
          termsAccepted: true,
          dataConsent: true,
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewNotes: 'Auto-approved sample expert'
        }
      ];
      
      const result = await db.collection('expertapplications').insertMany(sampleExperts);
      console.log('✅ Created', result.insertedCount, 'sample experts');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkExperts();