/**
 * Test Script to Upload Sample Symptom Data to Firebase
 * Run this to create initial test data in your Firebase database
 * 
 * Usage: node scripts/uploadTestSymptoms.js
 */

import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';

// Your Firebase config (from firebaseConfig.ts)
const firebaseConfig = {
    apiKey: "AIzaSyDkMhgDJCkfOhxfvQIBLdQgpJZjWGmhQXo",
    authDomain: "mycancercompanion-3e8b9.firebaseapp.com",
    projectId: "mycancercompanion-3e8b9",
    storageBucket: "mycancercompanion-3e8b9.firebasestorage.app",
    messagingSenderId: "1090050063827",
    appId: "1:1090050063827:web:6e5c3f6f6e4c8f8f8f8f8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data for IOS FISH 3
const testData = {
    userId: 'S6H3ioC6kwf66RmtB7MdiaeFdUP2',
    date: '2026-01-12',
    timestamp: Timestamp.now(),
    symptoms: {
        'Nausea': {
            severity: 8,
            notes: 'Worse after lunch, lasted 2 hours'
        },
        'Fatigue': {
            severity: 6,
            notes: 'Needed afternoon nap'
        },
        'Pain': {
            severity: 3,
            notes: 'Mild headache'
        }
    },
    symptomArray: [
        {
            name: 'Nausea',
            severity: 8,
            notes: 'Worse after lunch, lasted 2 hours'
        },
        {
            name: 'Fatigue',
            severity: 6,
            notes: 'Needed afternoon nap'
        },
        {
            name: 'Pain',
            severity: 3,
            notes: 'Mild headache'
        }
    ],
    checkedSymptomCount: 3,
    overallFeeling: 5
};

async function uploadTestData() {
    try {
        const docId = `${testData.userId}_${testData.date}`;
        const docRef = doc(db, 'symptom_logs', docId);

        await setDoc(docRef, testData);

        console.log('✅ SUCCESS! Test data uploaded to Firebase');
        console.log(`📄 Document ID: ${docId}`);
        console.log(`📊 Collection: symptom_logs`);
        console.log(`👤 User: IOS FISH 3 (${testData.userId})`);
        console.log(`📅 Date: ${testData.date}`);
        console.log(`💊 Symptoms logged: ${testData.checkedSymptomCount}`);
        console.log('\n🔍 View in Firebase Console:');
        console.log('https://console.firebase.google.com/project/mycancercompanion-3e8b9/firestore/data/symptom_logs');

        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR uploading test data:', error);
        process.exit(1);
    }
}

uploadTestData();
