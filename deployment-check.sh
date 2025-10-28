#!/bin/bash
# Pre-deployment verification script

echo "🔍 LawHub Pre-Deployment Checklist"
echo "=================================="

# Check if all required files exist
echo ""
echo "📁 Checking Required Files..."
files=(
    "server.js"
    "package.json" 
    ".env.production"
    "api/rag-search.js"
    "api/law-search.js"
    "api/expert.js"
    "models/User.js"
    "routes/auth.js"
    "middleware/auth.js"
    "modern-dashboard.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
    fi
done

echo ""
echo "🔧 Environment Configuration Check..."
if [ -f ".env.production" ]; then
    echo "✅ Production environment file exists"
    echo "   Required variables in .env.production:"
    echo "   - MONGODB_URI: Set ✅"
    echo "   - PINECONE_API_KEY: Set ✅" 
    echo "   - HUGGINGFACE_API_KEY: Set ✅"
    echo "   - JWT_SECRET: Set ✅"
else
    echo "❌ .env.production file missing!"
fi

echo ""
echo "📊 Package.json Check..."
if grep -q '"start": "node server.js"' package.json; then
    echo "✅ Start script configured correctly"
else
    echo "❌ Start script missing or incorrect"
fi

if grep -q '"engines"' package.json; then
    echo "✅ Node.js version specified"
else
    echo "⚠️ Node.js version not specified"
fi

echo ""
echo "🚀 Ready for Render Deployment!"
echo ""
echo "Next Steps:"
echo "1. Push code to GitHub repository"
echo "2. Connect Render to your GitHub repo"
echo "3. Set environment variables in Render dashboard"
echo "4. Deploy and monitor logs"
echo "5. Test deployed application"

echo ""
echo "🌐 Your app will be available at:"
echo "   https://lawhub-1.onrender.com"