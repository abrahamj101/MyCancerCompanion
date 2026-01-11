import { signInAnonymously } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { getUserByUid } from '../services/UserService';
import { storage } from '../utils/storage';

interface AuthContextType {
    isAuthenticated: boolean;
    profileComplete: boolean | null;
    setProfileComplete: (value: boolean) => void;
    isLoading: boolean;
    actualUserId: string | null; // The REAL user ID from AsyncStorage (persists across reloads)
    signOut: () => Promise<void>; // Function to clear session and restart
    refreshAuth: () => Promise<void>; // Function to refresh auth state from AsyncStorage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actualUserId, setActualUserId] = useState<string | null>(null);

    const signOut = async () => {
        console.log('🚪 [AuthContext] Signing out...');
        // Clear AsyncStorage
        await storage.removeItem('onboardingCompletedForUID');
        // Reset all state
        setActualUserId(null);
        setProfileComplete(null);
        setIsAuthenticated(false);
        console.log('✅ [AuthContext] Sign out complete - state reset');
    };

    const refreshAuth = async () => {
        console.log('🔄 [AuthContext] Refreshing auth state...');
        const storedUID = await storage.getItem('onboardingCompletedForUID');
        if (storedUID) {
            setActualUserId(storedUID);
            setProfileComplete(true);
            console.log('✅ [AuthContext] Auth refreshed - UID:', storedUID);
        } else {
            setActualUserId(null);
            setProfileComplete(null);
            console.log('⚠️  [AuthContext] No stored UID found');
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('═══════════════════════════════════════════════════');
                console.log('🚀 [AuthContext] APP INITIALIZATION STARTED');
                console.log('📱 Platform:', Platform.OS);
                console.log('⏰ Timestamp:', new Date().toISOString());
                console.log('═══════════════════════════════════════════════════');

                // STEP 1: Check if we have a stored UID from a previous session
                console.log('\n📦 STEP 1: Checking for existing user in AsyncStorage...');
                const storedUID = await storage.getItem('onboardingCompletedForUID');
                console.log('   → Stored UID:', storedUID || 'NULL');

                // STEP 2: Always sign in anonymously (Firebase requirement)
                console.log('\n🔐 STEP 2: Signing in anonymously to Firebase...');
                const userCredential = await signInAnonymously(FIREBASE_AUTH);
                console.log('   ✅ Anonymous sign-in successful');
                console.log('   → New Firebase UID:', userCredential.user.uid);
                console.log('   ⚠️  Note: This UID changes on each reload (expected behavior)');
                setIsAuthenticated(true);

                // STEP 3: Check if the STORED UID (not the new Firebase UID) has a profile
                if (storedUID) {
                    console.log('\n🔍 STEP 3: Checking if stored UID has a profile in Firebase...');
                    console.log('   → Looking up UID:', storedUID);

                    const userProfile = await getUserByUid(storedUID);
                    console.log('   → Profile exists?', userProfile ? 'YES' : 'NO');
                    console.log('   → Profile complete?', userProfile?.profileComplete ? 'YES' : 'NO');

                    if (userProfile && userProfile.profileComplete === true) {
                        // Profile exists! Skip onboarding
                        setActualUserId(storedUID); // Set the REAL user ID
                        setProfileComplete(true);
                        console.log('   ✅ RESULT: Profile found - skipping onboarding');
                        console.log('   → User will see main app');
                        console.log('   → Actual User ID set to:', storedUID);
                    } else {
                        // UID stored but no profile - data mismatch, clear and show onboarding
                        console.log('   ⚠️  RESULT: UID stored but no profile found');
                        console.log('   → Clearing stale UID from AsyncStorage');
                        await storage.removeItem('onboardingCompletedForUID');
                        setProfileComplete(false);
                        console.log('   → User will see onboarding');
                    }
                } else {
                    // No stored UID - new user
                    console.log('\n🆕 STEP 3: No stored UID - this is a new user');
                    setProfileComplete(false);
                    console.log('   → User will see onboarding');
                }
            } catch (error) {
                console.error('\n❌ ERROR during initialization:', error);
                console.error('   → Error type:', error instanceof Error ? error.name : typeof error);
                console.error('   → Error message:', error instanceof Error ? error.message : String(error));
                setIsAuthenticated(false);
                setProfileComplete(false);
            } finally {
                setIsLoading(false);
                console.log('\n═══════════════════════════════════════════════════');
                console.log('🏁 [AuthContext] INITIALIZATION COMPLETE');
                console.log('   → profileComplete:', profileComplete);
                console.log('═══════════════════════════════════════════════════\n');
            }
        };

        initializeApp();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, profileComplete, setProfileComplete, isLoading, actualUserId, signOut, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
