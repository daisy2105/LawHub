# 🔧 Quick Setup Instructions

## Copy these values from your Supabase project:

### In Supabase Dashboard:
1. Go to Settings → API
2. Copy your **Project URL** 
3. Copy your **anon public key**

### Update your files:
Replace the placeholders in BOTH `login2.html` and `signup2.html`:

```javascript
// REPLACE THESE LINES:
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

// WITH YOUR ACTUAL VALUES:
const supabaseUrl = 'https://your-project-id.supabase.co'  // ← Your Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIs...'  // ← Your anon public key
```

## 🧪 Test Your Setup:

1. Open `simple-index.html` in your browser
2. Click "Sign Up" 
3. Create a test account
4. Check your email for confirmation
5. Try logging in!

## ✅ Success Indicators:

- You can create an account without errors
- You receive a confirmation email
- You can log in after confirming your email
- No console errors in browser dev tools (F12)

## 🚨 If you get errors:

- Double-check your URL and key are correct
- Make sure you're using the **anon** key, not the service_role key
- Check browser console (F12) for specific error messages
