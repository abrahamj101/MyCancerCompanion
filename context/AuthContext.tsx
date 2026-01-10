import { signInAnonymously } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { getUserByUid } from '../services/UserService';
import { storage } from '../utils/storage';

interface AuthContextType {
    isAuthenticated: boolean;
    profileComplete: boolean | null;
    setProfileComplete: (value: boolean) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Step 1: Authenticate anonymously
                const userCredential = await signInAnonymously(FIREBASE_AUTH);
                console.log('✅ Anonymous user signed in successfully');
                console.log('User UID:', userCredential.user.uid);
                setIsAuthenticated(true);

                // Step 2: Check if THIS specific user has completed onboarding
                const completedUID = await storage.getItem('onboardingCompletedForUID');
                console.log('🔍 Current UID:', userCredential.user.uid);
                console.log('🔍 Stored UID:', completedUID);

                if (completedUID && completedUID !== userCredential.user.uid) {
                    // Different user detected - clear old data and show onboarding
                    console.log('⚠️ Different user detected, clearing old onboarding data');
                    await storage.removeItem('onboardingCompletedForUID');
                    setProfileComplete(false);
                    return;
                }

                if (completedUID === userCredential.user.uid) {
                    // Same user - verify with Firebase
                    const userProfile = await getUserByUid(userCredential.user.uid);

                    if (userProfile && userProfile.profileComplete === true) {
                        setProfileComplete(true);
                        console.log('✅ Profile complete (verified with Firebase)');
                    } else {
                        // UID stored but no Firebase profile - data mismatch
                        await storage.removeItem('onboardingCompletedForUID');
                        setProfileComplete(false);
                        console.log('⚠️ UID/Firebase mismatch - showing onboarding');
                    }
                } else {
                    // No stored UID - check Firebase
                    const userProfile = await getUserByUid(userCredential.user.uid);

                    if (userProfile && userProfile.profileComplete === true) {
                        // Profile exists in Firebase - update storage
                        await storage.setItem('onboardingCompletedForUID', userCredential.user.uid);
                        setProfileComplete(true);
                        console.log('✅ Profile complete (updated storage)');
                    } else {
                        // No profile - show onboarding
                        setProfileComplete(false);
                        console.log('📝 No profile found - showing onboarding');
                    }
                }
            } catch (error) {
                console.error('❌ Error initializing app:', error);
                setIsAuthenticated(false);
                setProfileComplete(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, profileComplete, setProfileComplete, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
