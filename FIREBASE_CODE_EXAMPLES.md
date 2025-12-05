# Firebase Online Users - Code Examples & Recipes

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Authentication Examples](#authentication-examples)
3. [Database Operations](#database-operations)
4. [Advanced Scenarios](#advanced-scenarios)
5. [Debugging & Testing](#debugging--testing)

---

## Basic Setup

### Minimal Firebase Integration

```javascript
// 1. Load Firebase
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js"></script>

// 2. Configure Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// 3. Initialize
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
```

### From Environment Variables (Recommended)

```javascript
// In your .env file
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
// ... other vars

// In your HTML/JS
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
```

---

## Authentication Examples

### Email/Password Login

```javascript
function signUp(email, password, displayName) {
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // Update profile
      user.updateProfile({ displayName: displayName })
        .then(() => {
          console.log('User created:', user.uid);
          // User will be set online automatically via onAuthStateChanged
        });
    })
    .catch((error) => {
      console.error('Sign up error:', error.message);
    });
}

function signIn(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('Signed in:', userCredential.user.email);
      // User will be set online automatically
    })
    .catch((error) => {
      console.error('Sign in error:', error.message);
    });
}

function signOut() {
  firebase.auth().signOut()
    .then(() => {
      console.log('Signed out');
      // User will be removed from online users
    })
    .catch((error) => {
      console.error('Sign out error:', error.message);
    });
}
```

### Google Sign-In

```javascript
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log('Google sign-in successful:', user.email);
      // User will be set online automatically
    })
    .catch((error) => {
      console.error('Google sign-in error:', error.message);
    });
}
```

### Check Authentication State

```javascript
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('User is authenticated:', user.uid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    
    // Set user online
    setUserOnline(user.uid, user.displayName || user.email);
  } else {
    console.log('No user authenticated');
    // User is removed from online users automatically
  }
});

// Get current user anytime
const currentUser = firebase.auth().currentUser;
if (currentUser) {
  console.log('Current user UID:', currentUser.uid);
}
```

---

## Database Operations

### Set User Online

```javascript
function setUserOnline(uid, name) {
  const userRef = firebase.database().ref(`onlineUsers/${uid}`);
  
  userRef.set({
    uid: uid,
    name: name,
    status: 'online',
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    console.log('User set online');
  })
  .catch((error) => {
    console.error('Error setting user online:', error);
  });
}
```

### Set Up Automatic Disconnect

```javascript
function setupPresenceTracking(uid) {
  const userRef = firebase.database().ref(`onlineUsers/${uid}`);
  const connectedRef = firebase.database().ref('.info/connected');
  
  connectedRef.on('value', (snapshot) => {
    if (snapshot.val() === true) {
      // We're connected
      userRef.set({
        uid: uid,
        name: firebase.auth().currentUser.email,
        status: 'online',
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Remove on disconnect
      userRef.onDisconnect().remove()
        .then(() => {
          console.log('Disconnect handler set');
        });
    }
  });
}
```

### Read Online Users

```javascript
// Read all online users (one time)
firebase.database().ref('onlineUsers').once('value', (snapshot) => {
  const onlineUsers = snapshot.val();
  console.log('Online users:', onlineUsers);
});

// Listen for changes (real-time)
firebase.database().ref('onlineUsers').on('value', (snapshot) => {
  const onlineUsers = snapshot.val() || {};
  const count = Object.keys(onlineUsers).length;
  console.log(`${count} users online`);
  
  // List online users
  Object.values(onlineUsers).forEach(user => {
    console.log(`- ${user.name} (${user.uid})`);
  });
});

// Listen for child added
firebase.database().ref('onlineUsers').on('child_added', (snapshot) => {
  const user = snapshot.val();
  console.log(`${user.name} came online`);
});

// Listen for child removed
firebase.database().ref('onlineUsers').on('child_removed', (snapshot) => {
  const user = snapshot.val();
  console.log(`${user.name} went offline`);
});
```

### Update User Data

```javascript
function updateUserStatus(uid, status) {
  firebase.database().ref(`onlineUsers/${uid}`).update({
    status: status,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    console.log('Status updated');
  })
  .catch((error) => {
    console.error('Error updating status:', error);
  });
}
```

### Remove User from Online

```javascript
function setUserOffline(uid) {
  firebase.database().ref(`onlineUsers/${uid}`).remove()
    .then(() => {
      console.log('User removed from online');
    })
    .catch((error) => {
      console.error('Error removing user:', error);
    });
}
```

---

## Advanced Scenarios

### Get Online Count

```javascript
function getOnlineCount() {
  return firebase.database().ref('onlineUsers').once('value')
    .then((snapshot) => {
      return Object.keys(snapshot.val() || {}).length;
    });
}

// Usage
getOnlineCount().then(count => {
  console.log(`${count} users online`);
});
```

### Get List of Online Users

```javascript
function getOnlineUsers() {
  return firebase.database().ref('onlineUsers').once('value')
    .then((snapshot) => {
      return Object.values(snapshot.val() || {});
    });
}

// Usage
getOnlineUsers().then(users => {
  users.forEach(user => {
    console.log(`${user.name}: online since ${new Date(user.lastSeen)}`);
  });
});
```

### Check if Specific User is Online

```javascript
function isUserOnline(uid) {
  return firebase.database().ref(`onlineUsers/${uid}`).once('value')
    .then((snapshot) => {
      return snapshot.exists();
    });
}

// Usage
isUserOnline('user123').then(online => {
  console.log('User online:', online);
});
```

### Get Last Seen Time

```javascript
function getLastSeenTime(uid) {
  return firebase.database().ref(`onlineUsers/${uid}/lastSeen`).once('value')
    .then((snapshot) => {
      const timestamp = snapshot.val();
      if (timestamp) {
        return new Date(timestamp);
      }
      return null;
    });
}

// Usage
getLastSeenTime('user123').then(lastSeen => {
  if (lastSeen) {
    console.log('Last seen:', lastSeen.toLocaleString());
  }
});
```

### Real-Time Online Count Display

```javascript
function setupOnlineCounterDisplay() {
  const counterElement = document.getElementById('onlineCount');
  
  firebase.database().ref('onlineUsers').on('value', (snapshot) => {
    const count = Object.keys(snapshot.val() || {}).length;
    counterElement.textContent = count;
    
    // Optional: Add animation
    counterElement.classList.add('pulse');
    setTimeout(() => {
      counterElement.classList.remove('pulse');
    }, 600);
  });
}

// Call this on page load
setupOnlineCounterDisplay();
```

### Show Online Friends

```javascript
function showOnlineFriends(currentUserFriends) {
  firebase.database().ref('onlineUsers').once('value', (snapshot) => {
    const allOnline = snapshot.val() || {};
    const onlineFriends = [];
    
    currentUserFriends.forEach(friendUid => {
      if (allOnline[friendUid]) {
        onlineFriends.push(allOnline[friendUid]);
      }
    });
    
    console.log('Online friends:', onlineFriends);
    // Display in UI
  });
}
```

### Archive Old Online Records

```javascript
function cleanupOldRecords() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  firebase.database().ref('onlineUsers').once('value', (snapshot) => {
    const updates = {};
    
    snapshot.forEach((child) => {
      if (child.val().lastSeen < thirtyDaysAgo) {
        updates[child.key] = null; // Mark for deletion
      }
    });
    
    if (Object.keys(updates).length > 0) {
      firebase.database().ref('onlineUsers').update(updates)
        .then(() => {
          console.log('Old records cleaned up');
        });
    }
  });
}

// Run daily via scheduled function or cron job
```

---

## Debugging & Testing

### Log All Database Activity

```javascript
// Log all changes to onlineUsers
firebase.database().ref('onlineUsers').on('value', (snapshot) => {
  console.log('Current state:', snapshot.val());
});

firebase.database().ref('onlineUsers').on('child_added', (snapshot) => {
  console.log('Added:', snapshot.val());
});

firebase.database().ref('onlineUsers').on('child_changed', (snapshot) => {
  console.log('Changed:', snapshot.val());
});

firebase.database().ref('onlineUsers').on('child_removed', (snapshot) => {
  console.log('Removed:', snapshot.val());
});
```

### Check Firebase Connection Status

```javascript
// Monitor connection
firebase.database().ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true) {
    console.log('✓ Connected to Firebase');
  } else {
    console.log('✗ Disconnected from Firebase');
  }
});

// Force disconnect/reconnect (for testing)
firebase.database().goOffline();  // Disconnect
firebase.database().goOnline();   // Reconnect
```

### Test Security Rules

```javascript
// Firebase Console > Realtime Database > Rules > Simulator tab

// Test unauthorized write
firebase.database().ref('onlineUsers/someotheruid').set({
  uid: 'someotheruid',
  name: 'Hacker'
})
.catch((error) => {
  console.log('Write denied (expected):', error.code);
  // Should show: "PERMISSION_DENIED"
});

// Test authorized write
const currentUser = firebase.auth().currentUser;
firebase.database().ref(`onlineUsers/${currentUser.uid}`).set({
  uid: currentUser.uid,
  name: currentUser.email,
  status: 'online'
})
.then(() => {
  console.log('Write successful (expected)');
});
```

### Performance Monitoring

```javascript
// Measure database operation time
const startTime = performance.now();

firebase.database().ref('onlineUsers').once('value', (snapshot) => {
  const endTime = performance.now();
  console.log(`Read took ${(endTime - startTime).toFixed(2)}ms`);
  console.log('Data size:', JSON.stringify(snapshot.val()).length, 'bytes');
});
```

### Memory Usage Check

```javascript
// Check for memory leaks
if (performance.memory) {
  const used = performance.memory.usedJSHeapSize / 1048576;
  console.log(`Memory used: ${used.toFixed(2)}MB`);
}
```

---

## Common Error Handling

### Handle Auth Errors

```javascript
firebase.auth().signInWithEmailAndPassword(email, password)
  .catch((error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        console.error('Invalid email format');
        break;
      case 'auth/user-disabled':
        console.error('User account disabled');
        break;
      case 'auth/user-not-found':
        console.error('User not found');
        break;
      case 'auth/wrong-password':
        console.error('Incorrect password');
        break;
      default:
        console.error('Authentication error:', error.message);
    }
  });
```

### Handle Database Errors

```javascript
firebase.database().ref('onlineUsers').set(userData)
  .catch((error) => {
    if (error.code === 'PERMISSION_DENIED') {
      console.error('Permission denied - check security rules');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - check connectivity');
    } else {
      console.error('Database error:', error.message);
    }
  });
```

---

## Testing Scenarios

### Scenario 1: Login & Verify Online

```javascript
// 1. Sign in
firebase.auth().signInWithEmailAndPassword('test@example.com', 'password123')
  .then(() => {
    // 2. Wait a moment
    setTimeout(() => {
      // 3. Check online users
      firebase.database().ref('onlineUsers').once('value', (snapshot) => {
        const users = snapshot.val();
        console.log('Users online:', Object.keys(users).length);
        console.assert(Object.keys(users).length > 0, 'No users online!');
      });
    }, 1000);
  });
```

### Scenario 2: Multi-User Test

```javascript
// Open in multiple browsers/tabs with different users
// Run this in console of each tab:

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log(`User: ${user.email}`);
    
    firebase.database().ref('onlineUsers').on('value', snapshot => {
      const count = Object.keys(snapshot.val() || {}).length;
      document.title = `Online: ${count}`;
    });
  }
});
```

### Scenario 3: Simulate Disconnect

```javascript
// After login, in console:

// Simulate disconnect
firebase.database().goOffline();
console.log('Offline mode');

// Wait 2 seconds
setTimeout(() => {
  // Check if removed from online
  firebase.database().ref('onlineUsers').once('value', snapshot => {
    console.log('Users while offline:', snapshot.val());
  });
}, 2000);

// Reconnect
firebase.database().goOnline();
console.log('Reconnecting...');
```

---

## Performance Tips

### Optimal Listener Setup

```javascript
// ✓ GOOD: Listen to top-level path
firebase.database().ref('onlineUsers').on('value', handleUpdate);

// ✗ BAD: Listen to nested paths (more overhead)
firebase.database().ref('onlineUsers').on('child_added', handleAdd);
firebase.database().ref('onlineUsers').on('child_removed', handleRemove);
// Use the above only if you need specific events
```

### Efficient Queries

```javascript
// ✓ GOOD: Simple read
firebase.database().ref('onlineUsers').once('value');

// ✗ BAD: Complex filtering (do on client)
firebase.database().ref('onlineUsers')
  .orderByChild('lastSeen')
  .limitToLast(10)
  .once('value');
// Use this only if necessary
```

---

This guide covers all common use cases. For more examples, check the [Firebase Documentation](https://firebase.google.com/docs/database).
