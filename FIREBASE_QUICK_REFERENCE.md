# Firebase Online Users Indicator - Quick Reference

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Firebase Credentials
- Go to [Firebase Console](https://console.firebase.google.com)
- Create project → Authentication (Email/Google) → Realtime Database

### Step 2: Copy Configuration
```javascript
// From Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 3: Update index.html
Find this in `index.html` (around line 2216):
```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  // ... etc
```

Replace with your actual credentials.

### Step 4: Set Security Rules
Go to Firebase Console > Realtime Database > Rules tab:
```json
{
  "rules": {
    "onlineUsers": {
      "$uid": {
        ".write": "auth.uid === $uid",
        ".read": true,
        "uid": {".validate": "newData.val() === auth.uid"},
        "name": {".validate": "newData.isString() && newData.val().length > 0"},
        "status": {".validate": "newData.val() === 'online'"},
        "lastSeen": {".validate": "newData.val() === now"},
        "$other": {".validate": "newData.isString() || newData.isNumber()"}
      }
    },
    ".read": false,
    ".write": false
  }
}
```

### Step 5: Test
1. Open website → indicator shows 0 online
2. Login with email/Google → indicator shows 1 online
3. Open in another browser/incognito → login → both show 2 online ✓

## 📊 Database Structure

```
/onlineUsers/{uid}
  uid: "firebase-uid"
  name: "user@email.com"
  status: "online"
  lastSeen: 1701795200000
```

## 🔐 Security Rules Explained

| Rule | Purpose |
|------|---------|
| `.write: "auth.uid === $uid"` | Only user can update their own status |
| `.read: true` | Public read (needed for counter) |
| `.validate: "newData.val() === auth.uid"` | Prevent UID spoofing |
| `.onDisconnect().remove()` | Auto-remove on disconnect |
| Default: `.read/.write: false` | Deny everything else |

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Firebase not configured" | Check firebaseConfig credentials |
| Counter not updating | Ensure Realtime Database is enabled |
| Permission denied error | Update Security Rules and republish |
| Users not online | Verify authentication is working |

## 📈 What Gets Tracked

✅ Real Firebase UIDs (not random IDs)
✅ User email/display name
✅ Online status
✅ Last seen timestamp
✅ Automatic disconnect handling

## 📱 UI Indicator

Location: **Bottom-right corner** of page
Shows: "🟢 X online" (where X = number of online users)
Animated: Pulses when count changes
Clickable: Shows list of online users

## 🔗 File Reference

| File | Purpose |
|------|---------|
| `index.html` | Main app with Firebase code |
| `FIREBASE_SETUP_GUIDE.md` | Detailed step-by-step guide |
| `FIREBASE_REALTIME_README.md` | Architecture & implementation docs |
| `firebase-rules.json` | Security rules (copy to Firebase Console) |
| `.env.example` | Environment variables template |

## 💡 Key Functions

```javascript
// Initialize Firebase
initializeFirebase()

// Listen for authentication
setupAuthStateListener()

// Track user as online
setUserOnline(uid, userName)

// Set up presence tracking
setupPresenceSystem(uid)

// Listen for online users
setupOnlineUsersListener()

// Update counter
updateOnlineUsersDisplay(count)

// Show online users list
showOnlineUsersDetails()
```

## 🌍 Environment Variables

```bash
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx
```

## 📊 Expected Data Flow

```
User Logs In
    ↓
Firebase Authentication validates credentials
    ↓
User UID stored in currentUserUID
    ↓
setUserOnline() writes user to /onlineUsers/{uid}
    ↓
setupPresenceSystem() sets up auto-disconnect
    ↓
setupOnlineUsersListener() fires, count updates
    ↓
All connected clients receive update instantly
    ↓
Counter displays new count with animation
```

## ✅ Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Realtime Database created
- [ ] Security Rules updated
- [ ] firebaseConfig filled with real credentials
- [ ] No API keys in git (use .env)
- [ ] Tested with multiple users
- [ ] Tested logout functionality
- [ ] Deployed to production

## 📞 Support Links

- [Firebase Console](https://console.firebase.google.com)
- [Realtime Database Docs](https://firebase.google.com/docs/database)
- [Auth Documentation](https://firebase.google.com/docs/auth)
- [Pricing Calculator](https://firebase.google.com/pricing)

---

**Need more details?** Read `FIREBASE_SETUP_GUIDE.md` for comprehensive instructions.
