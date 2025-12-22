import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBuQkI6CtRfR8Ivu3KPXPtU6KvprrdcmzA",
    authDomain: "mycancercompanion-1.firebaseapp.com",
    projectId: "mycancercompanion-1",
    storageBucket: "mycancercompanion-1.firebasestorage.app",
    messagingSenderId: "503966516946",
    appId: "1:503966516946:web:f96854cefb4b82506d4f0b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const FIREBASE_DB = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const FIREBASE_AUTH = getAuth(app);

export default app;
