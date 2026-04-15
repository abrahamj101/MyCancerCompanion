import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword
} from 'firebase/auth';
import React, { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { getUserByUid, saveUserProfile } from '../services/UserService';
import { storage } from '../utils/storage';

// Configure native Google Sign-In (runs once at module level)
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
});

interface AuthContextType {
    isAuthenticated: boolean;
    profileComplete: boolean | null;
    setProfileComplete: (value: boolean) => void;
    isLoading: boolean;
    actualUserId: string | null;
    userRole: 'patient' | 'mentor' | 'admin' | null;
    userEmail: string | null;
    accountStatus: 'active' | 'pending' | 'suspended' | null;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actualUserId, setActualUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'patient' | 'mentor' | 'admin' | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [accountStatus, setAccountStatus] = useState<'active' | 'pending' | 'suspended' | null>(null);
    const router = useRouter();



    // Check if user has a complete profile in Firestore
    const checkUserProfile = async (user: FirebaseUser): Promise<boolean> => {
        try {
            console.log('🔍 [AuthContext] Checking profile for UID:', user.uid);
            const userProfile = await getUserByUid(user.uid);

            if (userProfile && userProfile.profileComplete === true) {
                console.log('✅ [AuthContext] Profile complete - user has onboarded');
                // Store user role
                setUserRole(userProfile.role);
                setAccountStatus(userProfile.accountStatus || 'active');
                return true;
            } else {
                console.log('⚠️ [AuthContext] Profile incomplete or missing');
                return false;
            }
        } catch (error) {
            console.error('❌ [AuthContext] Error checking profile:', error);
            return false;
        }
    };

    // Create a skeleton profile for new users
    const createSkeletonProfile = async (user: FirebaseUser) => {
        try {
            console.log('📝 [AuthContext] Creating skeleton profile for:', user.uid);
            await saveUserProfile({
                uid: user.uid,
                firstName: '',
                email: user.email || '',
                role: 'patient',
                ageRange: '',
                cancerType: '',
                diagnosisStage: '',
                treatmentType: '',
                recurrences: '',
                supportNeeds: [],
                hobbies: [],
                bio: '',
                profileComplete: false,
                availableToChat: false,
                createdAt: new Date(),
            });
            console.log('✅ [AuthContext] Skeleton profile created');
        } catch (error) {
            console.error('❌ [AuthContext] Error creating skeleton profile:', error);
            // Don't throw - we'll let onboarding handle missing data
        }
    };

    // Sign up with email and password
    const signUpWithEmail = async (email: string, password: string) => {
        console.log('📧 [AuthContext] Signing up with email...');
        const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);

        // Create skeleton profile immediately
        await createSkeletonProfile(userCredential.user);

        // Store UID for persistence
        await storage.setItem('userUID', userCredential.user.uid);

        // Update state
        setActualUserId(userCredential.user.uid);
        setUserEmail(email);
        setIsAuthenticated(true);
        setProfileComplete(false);

        console.log('✅ [AuthContext] Sign up complete, redirecting to T&C...');
        router.replace('/terms-and-conditions');
    };

    // Sign in with email and password
    const signInWithEmail = async (email: string, password: string) => {
        console.log('📧 [AuthContext] Signing in with email...');
        const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);

        // Store UID for persistence
        await storage.setItem('userUID', userCredential.user.uid);

        // Check if profile exists
        const hasProfile = await checkUserProfile(userCredential.user);

        // Update state
        setActualUserId(userCredential.user.uid);
        setUserEmail(email);
        setIsAuthenticated(true);
        setProfileComplete(hasProfile);

        if (hasProfile) {
            // Also update the onboarding completed flag
            await storage.setItem('onboardingCompletedForUID', userCredential.user.uid);
            console.log('✅ [AuthContext] Sign in complete, layout will handle redirection.');
        } else {
            // Create skeleton if missing
            await createSkeletonProfile(userCredential.user);
            console.log('✅ [AuthContext] Sign in complete, redirecting to T&C...');
            router.replace('/terms-and-conditions');
        }
    };

    // Sign in with Google — uses native SDK, no browser redirect needed.
    // Requires a development or production build (not plain Expo Go).
    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const response = await GoogleSignin.signIn();
            // The shape of the response differs by SDK version;
            // idToken is at response.data.idToken (v13+) or response.idToken (v10-12).
            const idToken = (response as any).data?.idToken ?? (response as any).idToken;
            if (!idToken) throw new Error('Google Sign-In did not return an ID token.');

            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(FIREBASE_AUTH, credential);

            // For brand-new Google users, create a skeleton Firestore profile.
            // onAuthStateChanged fires next and handles navigation.
            const existingProfile = await getUserByUid(userCredential.user.uid);
            if (!existingProfile) {
                await createSkeletonProfile(userCredential.user);
                router.replace('/terms-and-conditions');
            }
            console.log('[AuthContext] Google sign-in successful:', userCredential.user.uid);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User dismissed the picker — not a real error, don't rethrow
                console.log('[AuthContext] Google sign-in cancelled by user');
                return;
            }
            console.error('[AuthContext] Google sign-in error:', error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        console.log('🚪 [AuthContext] Signing out...');
        try {
            await firebaseSignOut(FIREBASE_AUTH);
            await storage.removeItem('userUID');
            await storage.removeItem('onboardingCompletedForUID');

            setActualUserId(null);
            setUserRole(null);
            setUserEmail(null);
            setAccountStatus(null);
            setProfileComplete(null);
            setIsAuthenticated(false);

            console.log('✅ [AuthContext] Sign out complete');
            router.replace('/splash');
        } catch (error) {
            console.error('❌ [AuthContext] Sign out error:', error);
            throw error;
        }
    };

    // Refresh auth state from storage
    const refreshAuth = async () => {
        console.log('🔄 [AuthContext] Refreshing auth state...');
        const storedUID = await storage.getItem('onboardingCompletedForUID');
        if (storedUID) {
            setActualUserId(storedUID);
            setProfileComplete(true);

            // Fetch user profile to get role
            try {
                const userProfile = await getUserByUid(storedUID);
                if (userProfile) {
                    setUserRole(userProfile.role);
                    setAccountStatus(userProfile.accountStatus || 'active');
                    console.log('✅ [AuthContext] Auth refreshed - UID:', storedUID, 'Role:', userProfile.role);
                } else {
                    console.log('✅ [AuthContext] Auth refreshed - UID:', storedUID);
                }
            } catch (error) {
                console.error('❌ [AuthContext] Error fetching user profile:', error);
                console.log('✅ [AuthContext] Auth refreshed - UID:', storedUID);
            }
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        console.log('═══════════════════════════════════════════════════');
        console.log('🚀 [AuthContext] APP INITIALIZATION STARTED');
        console.log('📱 Platform:', Platform.OS);
        console.log('═══════════════════════════════════════════════════');

        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
            console.log('\n🔔 [AuthContext] Auth state changed:', user ? user.uid : 'null');

            if (user) {
                // User is signed in
                setIsAuthenticated(true);
                setActualUserId(user.uid);
                setUserEmail(user.email);

                // Check if they have a complete profile
                const hasProfile = await checkUserProfile(user);
                setProfileComplete(hasProfile);

                // Store UID for persistence
                await storage.setItem('userUID', user.uid);
                if (hasProfile) {
                    await storage.setItem('onboardingCompletedForUID', user.uid);
                }

                console.log('✅ [AuthContext] User authenticated:', user.uid, 'Profile complete:', hasProfile);
            } else {
                // User is signed out from Firebase
                console.log('👤 [AuthContext] User signed out from Firebase');
                setIsAuthenticated(false);
                setActualUserId(null);
                setUserRole(null);
                setUserEmail(null);
                setAccountStatus(null);
                setProfileComplete(null);
                // Note: We don't clear AsyncStorage here because Firebase might just be loading
                // AsyncStorage is only cleared on explicit signOut()
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            profileComplete,
            setProfileComplete,
            isLoading,
            actualUserId,
            userRole,
            userEmail,
            accountStatus,
            signInWithEmail,
            signUpWithEmail,
            signInWithGoogle,
            signOut,
            refreshAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
