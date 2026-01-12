/**
 * Migration Script to Add Default Location Data to Existing Users
 * Run this to update all existing users with default location information
 * 
 * Usage: node scripts/migrateUserLocations.js
 */

import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';

// Your Firebase config (from firebaseConfig.ts)
const firebaseConfig = {
    apiKey: "AIzaSyDkMhgDJCkfOhxfvQIBLdQgpJZjWGmhQXo",
    authDomain: "mycancercompanion-1.firebaseapp.com",
    projectId: "mycancercompanion-1",
    storageBucket: "mycancercompanion-1.firebasestorage.app",
    messagingSenderId: "1090050063827",
    appId: "1:1090050063827:web:6e5c3f6f6e4c8f8f8f8f8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default location values
const DEFAULT_LOCATION = {
    building: 'Sweetwater Pavilion',
    floor: '1'
};

async function migrateUserLocations() {
    try {
        console.log('🚀 Starting user location migration...\n');

        // Get all users from Firestore
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        if (snapshot.empty) {
            console.log('⚠️  No users found in database');
            process.exit(0);
        }

        console.log(`📊 Found ${snapshot.size} users in database\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process each user
        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            try {
                // Check if user already has location data
                if (userData.building || userData.floor) {
                    console.log(`⏭️  Skipped: ${userData.firstName || 'Unknown'} (${userId}) - Already has location data`);
                    skippedCount++;
                    continue;
                }

                // Update user with default location
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, DEFAULT_LOCATION);

                console.log(`✅ Updated: ${userData.firstName || 'Unknown'} (${userId})`);
                updatedCount++;

            } catch (error) {
                console.error(`❌ Error updating user ${userId}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Updated: ${updatedCount} users`);
        console.log(`⏭️  Skipped: ${skippedCount} users (already had location)`);
        console.log(`❌ Errors: ${errorCount} users`);
        console.log(`📊 Total: ${snapshot.size} users`);
        console.log('='.repeat(50));

        console.log('\n🎉 Migration completed successfully!');
        console.log(`\n📍 Default location applied:`);
        console.log(`   Building: ${DEFAULT_LOCATION.building}`);
        console.log(`   Floor: ${DEFAULT_LOCATION.floor}`);
        console.log('\n🔍 View in Firebase Console:');
        console.log('https://console.firebase.google.com/project/mycancercompanion-3e8b9/firestore/data/users');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ FATAL ERROR during migration:', error);
        process.exit(1);
    }
}

migrateUserLocations();
