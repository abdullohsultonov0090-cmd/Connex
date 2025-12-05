# Firebase Production Setup Guide - Online Users Indicator

This guide will help you set up Firebase Authentication and Realtime Database for your Connex application's real-time online users indicator.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or select an existing project
3. Follow the setup wizard:
   - Enter your project name (e.g., "Connex-Production")
   - Disable Google Analytics (optional)
   - Create the project

## Step 2: Enable Firebase Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get Started"**
3. Enable the authentication methods you need:
   - **Email/Password**: Click the Email/Password provider, toggle **Enabled**, and click Save
   - **Google**: Click Google, enter your Support email and Project public name, click Save
   - **(Optional) Other providers**: Facebook, Twitter, GitHub, etc.

## Step 3: Enable Firebase Realtime Database

1. Go to **Build** → **Realtime Database**
2. Click **"Create Database"**
3. Choose your database location (pick closest to your users)
4. Start in **"Test mode"** for development, or use **"Production mode"** with security rules (recommended)
5. Click **"Enable"**

## Step 4: Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon, top-left)
2. Scroll to **"Your apps"** section
3. Click your Web app (if none exists, click **"Web"** icon to add one)
4. Copy the configuration object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Update Your HTML Configuration

1. Open `index.html` in your editor
2. Find the `firebaseConfig` object (around line 2216)
3. Replace the placeholder values with your actual Firebase credentials
4. **Alternatively**, set environment variables and use:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

**DO NOT commit your API key to public repositories!** Use environment variables or a backend service for sensitive credentials.

## Step 6: Set Up Security Rules

1. Go to **Realtime Database** → **Rules** tab
2. Replace the default rules with the production rules below
3. Click **"Publish"**

### Production Security Rules

```json
{
  "rules": {
    "onlineUsers": {
      "$uid": {
        // Only the user can write their own online status
        ".write": "auth.uid === $uid",
        // Anyone can read online users (for the indicator)
        ".read": true,
        // Define the structure
        "uid": {
          ".validate": "newData.val() === auth.uid"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 255"
        },
        "status": {
          ".validate": "newData.val() === 'online'"
        },
        "lastSeen": {
          ".validate": "newData.val() === now"
        }
      }
    }
  }
}
```

### Explanation of Rules:

- **`.write: "auth.uid === $uid"`**: Only authenticated users can update their own online status
- **`.read: true`**: Anyone can read the online users list (needed for the real-time counter)
- **Validation rules**: Ensure data structure and prevent malicious updates
- **`.onDisconnect().remove()`**: Automatically removes user from online list when they disconnect

## Step 7: Test the Setup

1. Open your website in a browser
2. You should see the "Online Users" indicator in the bottom-right corner
3. Login with a test account
4. Open your website in another browser/incognito window
5. Login with a different account
6. The online counter should show 2 users
7. Logout from one account and the counter should decrease to 1

## Step 8: Authentication Integration

Your site should already have authentication. Make sure users are logging in through:
- Email/Password signup/login
- Google OAuth

The online indicator automatically tracks authenticated users via Firebase Authentication.

## Step 9: Deploy to Production

1. Set your environment variables on your hosting platform (Netlify, Vercel, Firebase Hosting, etc.)
2. Or update the `firebaseConfig` directly (not recommended for sensitive keys)
3. Deploy your application

## Troubleshooting

### "Firebase not configured" error
- Check that your `firebaseConfig` object has all required fields
- Verify the API Key is correct from Firebase Console
- Ensure Realtime Database is enabled

### Online counter not updating
- Open browser Developer Tools (F12)
- Check Console for errors
- Verify Firebase Authentication is enabled
- Check Realtime Database Rules are set to production rules above

### Users not appearing online
- Ensure users are authenticated (logged in)
- Check Firebase Authentication in Console to see users
- Verify `onlineUsers` appears in Realtime Database

### Permission denied errors
- Review your Security Rules
- Ensure `.write` rule allows authenticated users

## Security Considerations

✅ **Do:**
- Use Security Rules to restrict database writes
- Enable HTTPS on your domain
- Rotate API keys periodically
- Use Firebase Custom Claims for advanced authorization
- Monitor Firebase usage in Console

❌ **Don't:**
- Commit API keys to public git repositories
- Use Test Mode rules in production
- Allow unauthenticated writes to online status
- Store sensitive user data in Realtime Database

## Next Steps

1. Consider adding user profiles in a separate `users` collection
2. Add analytics to track peak online times
3. Implement notifications when friends come online
4. Add offline messaging using Cloud Functions

## Reference Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Realtime Database Rules Guide](https://firebase.google.com/docs/database/security)
- [Firebase SDK Reference](https://firebase.google.com/docs/web/setup)
