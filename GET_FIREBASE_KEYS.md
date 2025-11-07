# Get Frontend Firebase Keys

You need to get these values from Firebase Console to fix the frontend auth error:

## Steps to get the keys:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **simsync-1a87e**
3. Click the gear icon (Settings) → **Project settings**
4. Scroll down to **Your apps** section
5. Find your web app or click **Add app** if you don't have one
6. Copy the config values from the code snippet that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // ← VITE_FIREBASE_API_KEY
  authDomain: "simsync-1a87e.firebaseapp.com",
  projectId: "simsync-1a87e",
  storageBucket: "simsync-1a87e.firebasestorage.app", 
  messagingSenderId: "123456789",       // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123",      // ← VITE_FIREBASE_APP_ID
  measurementId: "G-ABC123DEF"          // ← VITE_FIREBASE_MEASUREMENT_ID (optional)
};
```

## What I need from you:

Please copy and paste these 4 values:
- `apiKey` 
- `messagingSenderId`
- `appId`
- `measurementId` (optional)

Once you provide these, I'll update the frontend `.env` file and your Firebase auth error will be fixed!