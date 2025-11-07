# SimSync Deployment Guide

## 🚀 Quick Setup

### 1. Environment Variables

You need to set up environment variables for both frontend and backend.

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-railway-url/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### Backend (.env)
```env
# Firebase Configuration (Service Account)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PRICE_ID=price_your_price_id_here

# CORS Origins
CORS_ORIGINS=https://simsync.dev,https://www.simsync.dev
```

### 2. What's Fixed

✅ **Landing Page Added**: Complete landing page with features, pricing, and call-to-action  
✅ **Premium Integration**: Stripe payments enabled with subscription management  
✅ **User Tiers**: Basic (50MB, 25 files) vs Premium (500MB, unlimited files)  
✅ **Storage Limits**: Enforced file upload limits based on subscription tier  
✅ **Routing Fixed**: Proper navigation between landing, login, dashboard, and premium pages  

### 3. Key Features

#### Basic Tier (Free)
- 50MB storage limit
- Up to 25 files
- Basic file types (.package, .trayitem, etc.)
- Email support

#### Premium Tier ($9.99/month)
- 500MB storage (10x more)
- Unlimited files
- All file types supported
- Priority support
- File sharing capabilities

### 4. Files That Need Environment Variables

Set these values in your hosting providers:

**Vercel (Frontend)**:
- Go to Project Settings > Environment Variables
- Add all VITE_* variables

**Railway (Backend)**:
- Go to Project Settings > Environment Variables
- Add all Firebase and Stripe variables

### 5. Important Notes

- The backend now automatically tracks user subscription status
- File upload limits are enforced based on subscription tier
- Payment webhooks automatically upgrade users to premium
- Storage usage is tracked and displayed in real-time

### 6. Testing

1. Visit the landing page at https://simsync.dev
2. Sign up for a free account
3. Try uploading files (should be limited to 50MB total)
4. Test premium upgrade flow
5. Verify premium users get increased limits

The missing landing page issue should now be completely resolved! 🎉