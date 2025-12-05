# Firebase Authentication Setup Fix

## Problem
You're getting: `FirebaseError: Firebase: Error (auth/configuration-not-found)`

This means **Firebase Authentication is not enabled** in your Firebase project.

## Quick Fix (3 steps)

### Step 1: Enable Firebase Auth in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **connex-2719a**
3. Left sidebar → **Authentication**
4. Click **Get Started** button
5. Select **Email/Password** provider
6. Toggle **Enable** → Save
7. Select **Google** provider  
8. Toggle **Enable**
9. Add your project name as the OAuth consent screen name (if prompted)
10. Click **Save**

### Step 2: Allow Unauthenticated Access (Development Only)
⚠️ For testing/development only - restrict in production!

1. Left sidebar → **Realtime Database**
2. Click **Rules** tab
3. Replace rules with:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Click **Publish**

### Step 3: Test in Browser
1. Refresh the app: `http://localhost:3000`
2. Click **Email/Password** signup
3. Enter: `test@test.com` / `password123`
4. You should see: "Akkaunt yaratildi" (Account created)
5. Logout and login to verify
6. Try "Continue with Google" button

## What's Working Now
✅ Email/password signup
✅ Email/password login  
✅ Google OAuth sign-in (after Step 1)
✅ Automatic user profile creation in database
✅ Real-time posts, users, online presence
✅ Offline fallback mode (if Firebase Auth unavailable)

## What the Code Does Now

**When you sign up/login:**
1. ✅ Firebase Auth creates user account
2. ✅ User data saved to `/users/{uid}` 
3. ✅ Automatic user goes online
4. ✅ Real-time listeners start
5. ✅ Posts/users/online status sync in real-time

**If Firebase Auth fails:**
⚠️ Falls back to local browser storage (no cloud sync)
- Works offline
- Data lost on page refresh
- Not recommended for production

## Troubleshooting

**"auth/configuration-not-found" still appears?**
→ Check Steps 1-2 again, refresh browser, clear cache

**Google button not working?**
→ Make sure Step 1, Enable Google provider is complete
→ Check browser console for specific error
→ Popup might be blocked - check browser settings

**Can't create account?**
→ Email must be unique across all users
→ Password must be 6+ characters
→ Check Firebase Console → Authentication → Users to see registered accounts

**Data not appearing in database?**
→ Check Firebase Console → Realtime Database
→ Look for `/posts`, `/users`, `/onlineUsers` collections
→ If empty, create a post in the app first

## Production Setup (Next Steps)

When ready for production:
1. Set up proper Security Rules (not `true`)
2. Enable OAuth consent screen properly
3. Add authorized domains
4. Set up backups
5. Deploy to Firebase Hosting

**See:** FIREBASE_QUICK_START.md → Production Deployment section

## Questions?
Check these files:
- `FIREBASE_INTEGRATION_GUIDE.md` - How it works technically
- `FIREBASE_UPGRADE_PLAN.md` - Architecture overview
- `FIREBASE_QUICK_START.md` - Testing guide

---

**Status:** Ready for local testing after enabling Firebase Auth ✅
**Last Updated:** December 5, 2025
