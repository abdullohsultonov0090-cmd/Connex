Removed Google Sign-In Summary

Files edited:
- `index.html`

What was removed:
1. The "Continue with Google" button and its markup (id `tpa-google-button`).
2. All JavaScript event listeners and code using `firebase.auth.GoogleAuthProvider`, `signInWithPopup`, and related Google OAuth handlers.
3. The URL query-parameter handling for `?google=success` / `?google=fail` used by server-side redirects.
4. Any code that used `user.displayName` or `user.photoURL` as primary user identity during sign-in. The app now derives a display name from the email when no DB profile exists, and avatar URL is empty by default.

What was changed:
- `setupAuthStateListener()` now prefers user profile data from the Realtime Database; if none exists it derives the user name from the email address and does not read `displayName` or `photoURL` from the Firebase user object.
- Error handling for Google-specific config errors was removed because Google sign-in is gone.

New login flow (Email/Password only):
1. User opens sign-in/signup dialog.
2. For signup: email and password are sent to `firebaseAuth.createUserWithEmailAndPassword`.
3. For login: email and password are sent to `firebaseAuth.signInWithEmailAndPassword`.
4. `onAuthStateChanged` sets up the user state by reading `/users/{uid}` from the Realtime Database; if the DB profile does not exist a default profile is created using the email-derived name and empty avatar.
5. All posts, presence, and other features remain unchanged and function as before.

Notes:
- If you want to allow users to set profile names or avatars, keep using the existing profile UI and persist values to `/users/{uid}`; the app will display those values from the DB.
- The `FIREBASE_AUTH_FIX.md` file still exists and remains useful for Auth setup, but Google-provider instructions are no longer needed.

Last Updated: December 5, 2025
