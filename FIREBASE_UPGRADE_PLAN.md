# Firebase Full-Stack Upgrade Plan

## Overview
This document outlines the complete transformation of the Connex app from a fake/client-only frontend to a real, fully-functional Firebase-backed application.

## Current State Issues
1. **Fake Data**: All posts, users, notifications are hardcoded in `loadState()` / localStorage
2. **No Real Auth**: Uses local email/password fallback, no Firebase Auth
3. **No Real Database**: No connection to Firestore or Realtime Database
4. **CDN Issues**: Mixed ESM/compat script tags causing `firebase is not defined` errors
5. **No Real Follow System**: Follow state stored in local memory, not persisted
6. **Message Data Local Only**: No real-time message sync

## Firebase Data Schema

### Firestore Collections

#### 1. `users/{uid}`
```
{
  uid: string,
  name: string,
  email: string,
  bio: string,
  avatarUrl: string,
  accountType: "public" | "private",
  followers: number,
  following: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 2. `posts/{postId}`
```
{
  id: string (auto-generated),
  uid: string (owner),
  userName: string (denormalized for quick display),
  content: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  likes: number,
  likedBy: [uid1, uid2, ...],
  comments: [
    { uid: string, text: string, createdAt: timestamp }
  ]
}
```

#### 3. `followers/{uid}/userFollowers/{followerUid}` (subcollection)
```
{
  followerUid: string,
  followerName: string,
  followedAt: timestamp
}
```

#### 4. `following/{uid}/userFollowing/{followingUid}` (subcollection)
```
{
  followingUid: string,
  followingName: string,
  followedAt: timestamp
}
```

#### 5. `conversations/{conversationId}`
```
{
  id: string,
  participants: [uid1, uid2],
  lastMessage: string,
  lastMessageTime: timestamp,
  createdAt: timestamp
}
```

#### 6. `messages/{conversationId}/{messageId}`
```
{
  id: string,
  uid: string (sender),
  text: string,
  createdAt: timestamp,
  edited: boolean,
  deletedAt: timestamp | null
}
```

#### 7. `notifications/{uid}/{notificationId}`
```
{
  id: string,
  fromUid: string,
  fromName: string,
  action: "like" | "follow" | "comment" | "mention",
  actionType: string,
  category: string,
  createdAt: timestamp,
  read: boolean
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{uid} {
      allow read: if request.auth.uid == uid || resource.data.accountType == 'public';
      allow write: if request.auth.uid == uid;
    }

    // Posts: public read, owner write/delete
    match /posts/{document=**} {
      allow read: if true;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }

    // Followers: own subcollection
    match /followers/{uid}/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }

    // Following: own subcollection
    match /following/{uid}/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }

    // Conversations: participant access
    match /conversations/{conversationId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid != null;
    }

    // Messages: participant access
    match /messages/{conversationId}/{document=**} {
      allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }

    // Notifications: own notifications
    match /notifications/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

## Implementation Steps

### Phase 1: Firebase Initialization & Auth (Days 1-2)
- [ ] Fix CDN scripts (compat builds)
- [ ] Remove ESM imports
- [ ] Implement Firebase Auth (Sign Up, Login, Logout)
- [ ] Add Auth state listener & persist user session
- [ ] Hide auth screen for authenticated users

### Phase 2: User System (Days 2-3)
- [ ] Create `users` collection on first signup
- [ ] Load user profile from Firestore
- [ ] Implement profile edit/update
- [ ] Add avatar upload to Firebase Storage
- [ ] Load follower/following counts

### Phase 3: Posts System (Days 3-4)
- [ ] Remove hardcoded posts from `loadState()`
- [ ] Create real-time post listener
- [ ] Implement post creation with Firestore
- [ ] Add edit/delete with ownership check
- [ ] Real-time like/comment UI updates

### Phase 4: Follow System (Days 4-5)
- [ ] Implement follow/unfollow logic
- [ ] Update follower counts in real time
- [ ] Sync follow state across tabs
- [ ] Show follower/following lists

### Phase 5: Messages & Notifications (Days 5-6)
- [ ] Move conversations to Firestore
- [ ] Real-time message sync
- [ ] Create notification triggers
- [ ] Implement notification read/dismiss

### Phase 6: Testing & Deployment (Days 6-7)
- [ ] End-to-end testing (multi-user scenarios)
- [ ] Firebase Hosting setup
- [ ] Performance optimization
- [ ] Production deployment

## Key Code Changes

### Before: Fake Data
```javascript
function loadState() {
  // Returns hardcoded posts, users, notifications
  return {
    posts: [{id: 'p1', userId: 'u1', text: 'Fake post', likes: 0}],
    users: [{id: 'u1', name: 'Fake User'}],
    ...
  };
}
```

### After: Firebase Real-Time
```javascript
let postsListener = null;

function setupPostsListener(uid) {
  const db = firebase.firestore();
  postsListener = db.collection('posts')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      state.posts = posts;
      renderPosts();
    });
}

async function createPost(content) {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;
  await db.collection('posts').add({
    uid: user.uid,
    userName: user.displayName,
    content: content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    likes: 0,
    likedBy: [],
    comments: []
  });
}
```

## Migration Checklist

- [ ] Firebase project created (connex-2719a already exists)
- [ ] Firestore database enabled
- [ ] Firebase Auth enabled (Email + Google)
- [ ] Security rules deployed
- [ ] CDN scripts fixed to compat builds
- [ ] `index.html` refactored for Firebase
- [ ] Auth flow implemented
- [ ] User profiles synced
- [ ] Posts real-time listener
- [ ] Follow system working
- [ ] Messages in Firestore
- [ ] Notifications triggered
- [ ] All end-to-end tests pass
- [ ] Deployed to Firebase Hosting

## Testing Scenarios

1. **Multi-User Signup**: 
   - User A signs up → User B signs up
   - Both see each other in public profiles ✓

2. **Posts & Feed**:
   - User A creates post → appears in real time on User B's feed
   - User B likes post → User A sees like count update ✓

3. **Follow System**:
   - User B follows User A → follower count increments
   - User A sees follower notification ✓

4. **Messages**:
   - User A sends DM to User B → appears in real time
   - User B replies → seen by both in same conversation ✓

5. **Session Persistence**:
   - User A logs out → logs back in
   - Same profile data, posts, followers visible ✓

## Notes

- All timestamps use `serverTimestamp()` for consistency
- User denormalization (userName in posts) allows fast query without joins
- Real-time listeners unsubscribed on logout
- Profile data cached locally but synced with Firestore
- Messages lazy-loaded (not all history at once)
