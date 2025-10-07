# LawHub - Learn the Constitution ⚖️

A modern, interactive platform for learning constitutional law and understanding legal principles. Built with HTML, CSS, JavaScript, and powered by MongoDB for data storage.

## 🌟 Features

- **Interactive Learning**: Engaging constitutional education with real-world examples
- **User Authentication**: Secure signup/login with MongoDB session management
- **Data Visualization**: Crime statistics and legal data insights
- **Responsive Design**: Works perfectly on desktop and mobile
- **Modern UI**: Glass-morphism design with smooth animations

## 🚀 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Session-based authentication
- **Database**: MongoDB
- **Charts**: Chart.js for data visualization
- **Design**: Modern glass-morphism UI

## 📋 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/OurRights.git
cd OurRights
```

### 2. Configure MongoDB Database
1. Install MongoDB locally or use MongoDB Atlas cloud service
2. Create a database for the application
3. Update the connection credentials in the configuration files
4. Set up required collections for users and legal content

### 3. Run the Application
Simply open `simple-index.html` in your web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have live-server)
npx live-server

# Using VS Code Live Server extension
```

## 📁 Project Structure

```
LawHub/
├── simple-index.html      # Main landing page
├── login2.html           # User login page
├── signup2.html          # User registration page
├── simple-style.css      # Main stylesheet
├── simple-script.js      # Main JavaScript functionality
├── mongodb-config.js      # MongoDB configuration
├── db-utils.js           # Database utility functions
├── crime_dataset_india.csv # Sample crime data for visualization
└── README.md             # This file
```

## 🔧 Configuration

### Supabase Setup
Replace the placeholders in your HTML files:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
```

With your actual Supabase credentials:

```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIs...' // Your anon key
```

## 🎯 Features Overview

### Authentication System
- ✅ Email/Password registration and login
- ✅ Email verification
- ✅ Password reset (built-in with Supabase)
- ✅ Session management
- ✅ Secure logout

### Main Features
- 📚 Constitutional learning modules
- 📊 Interactive data visualizations
- 💡 Real-world legal examples
- 🎯 Self-paced learning paths
- 📱 Mobile-responsive design

## 🛡️ Security Features

- Row Level Security (RLS) with Supabase
- Secure authentication with JWT tokens
- Password strength validation
- Email verification required
- Protected routes and content

## 🚀 Deployment

### Local Development
1. Open `simple-index.html` in a web browser
2. Configure Supabase credentials
3. Test authentication flow

### Production Deployment
1. Configure Supabase for your domain
2. Set up custom SMTP (optional)
3. Deploy to your preferred hosting (Vercel, Netlify, etc.)
4. Update Supabase Auth settings with your production URL

## 📊 Free Tier Limits (Supabase)

Perfect for most projects:
- Database: 500MB storage
- Auth: 50,000 users  
- Storage: 1GB files
- API: Unlimited requests
- Realtime: 200 concurrent connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Need help? 
- Check the MongoDB setup documentation
- Open an issue on GitHub
- Contact the development team

## 🙏 Acknowledgments

- MongoDB team for the robust database platform
- Chart.js for beautiful data visualizations
- Unsplash for high-quality images
- The open-source community

---

**Made with ❤️ for legal education and civic engagement**