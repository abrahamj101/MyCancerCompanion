import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    isAuthenticated: boolean;
    profileComplete: boolean | null;
    setProfileComplete: (value: boolean) => void;
    isLoading: boolean;
    actualUserId: string | null;
    userEmail: string | null;
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
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();


    // Use Expo auth proxy for Google OAuth
    const redirectUri = 'https://auth.expo.io/@abrahamj101/mycancercompanion';

    // Log the redirect URI prominently
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔗 COPY THIS REDIRECT URI TO GOOGLE CONSOLE:');
    console.log('   https://auth.expo.io/@abrahamj101/mycancercompanion');
    console.log('═══════════════════════════════════════════════════');

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        redirectUri: redirectUri,
    });

    // Log request object status
    useEffect(() => {
        console.log('📋 [AuthContext] Google Auth Request Status:');
        console.log('  Request object:', request ? 'READY ✅' : 'NOT READY ❌');
        if (request) {
            console.log('  Request URL:', request.url?.substring(0, 100) + '...');
            console.log('  Request Redirect URI:', request.redirectUri);
        }
    }, [request]);

    // Handle Google Auth response
    useEffect(() => {
        console.log('📨 [AuthContext] Google Auth Response:', response?.type || 'null');

        if (response?.type === 'success') {
            console.log('✅ [AuthContext] Google OAuth SUCCESS!');
            console.log('  Response params:', JSON.stringify(response.params, null, 2));
            const { id_token } = response.params;
            console.log('  ID Token received:', id_token ? 'YES ✅' : 'NO ❌');
            handleGoogleCredential(id_token);
        } else if (response?.type === 'error') {
            console.error('❌ [AuthContext] Google OAuth ERROR:', response.error);
            console.error('  Error params:', JSON.stringify((response as any).params, null, 2));
        } else if (response?.type === 'cancel') {
            console.log('🚫 [AuthContext] Google OAuth CANCELLED by user');
        } else if (response) {
            console.log('  Other response type:', response.type);
            if ('params' in response) {
                console.log('  Params:', JSON.stringify((response as any).params));
            }
        }
    }, [response]);

    const handleGoogleCredential = async (idToken: string) => {
        try {
            console.log('🔐 [AuthContext] Processing Google credential...');
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(FIREBASE_AUTH, credential);

            // Auth state change listener will handle the rest
            console.log('✅ [AuthContext] Google sign-in successful:', userCredential.user.uid);
        } catch (error) {
            console.error('❌ [AuthContext] Google credential error:', error);
            throw error;
        }
    };

    // Check if user has a complete profile in Firestore
    const checkUserProfile = async (user: FirebaseUser): Promise<boolean> => {
        try {
            console.log('🔍 [AuthContext] Checking profile for UID:', user.uid);
            const userProfile = await getUserByUid(user.uid);

            if (userProfile && userProfile.profileComplete === true) {
                console.log('✅ [AuthContext] Profile complete - user has onboarded');
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

        console.log('✅ [AuthContext] Sign up complete, redirecting to onboarding...');
        router.replace('/onboarding');
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
            console.log('✅ [AuthContext] Sign in complete, redirecting to tabs...');
            router.replace('/(tabs)');
        } else {
            // Create skeleton if missing
            await createSkeletonProfile(userCredential.user);
            console.log('✅ [AuthContext] Sign in complete, redirecting to onboarding...');
            router.replace('/onboarding');
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        console.log('🔵 [AuthContext] Initiating Google sign-in...');
        console.log('  Request status:', request ? 'READY' : 'NOT READY');

        if (!request) {
            console.error('❌ [AuthContext] Google auth request not ready!');
            console.error('  Check that Client IDs are set in .env file');
            throw new Error('Google auth not configured. Please add Google Client IDs.');
        }

        console.log('  Calling promptAsync()...');
        try {
            const result = await promptAsync();
            console.log('  promptAsync() returned:', result?.type);
        } catch (error) {
            console.error('❌ [AuthContext] promptAsync() error:', error);
            throw error;
        }
    };
    // The response will be handled by the useEffect above

    // Sign out
    const signOut = async () => {
        console.log('🚪 [AuthContext] Signing out...');
        try {
            await firebaseSignOut(FIREBASE_AUTH);
            await storage.removeItem('userUID');
            await storage.removeItem('onboardingCompletedForUID');

            setActualUserId(null);
            setUserEmail(null);
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
            console.log('✅ [AuthContext] Auth refreshed - UID:', storedUID);
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
                setUserEmail(null);
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
            userEmail,
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
