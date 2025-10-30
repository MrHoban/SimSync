import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAO_4DVV78b_7BhiWKhvjr5tlc8rj2B0aw",
  authDomain: "simsync-1a87e.firebaseapp.com",
  projectId: "simsync-1a87e",
  storageBucket: "simsync-1a87e.firebasestorage.app",
  messagingSenderId: "474577948053",
  appId: "1:474577948053:web:ee14db34721253c2a53a9c",
  measurementId: "G-QTRJ15MV2W"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app