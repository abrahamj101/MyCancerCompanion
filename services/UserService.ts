import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebaseConfig';
import { User } from '../types';

// Re-export User type for backward compatibility
export type { User };

/**
 * Get all mentors with matching cancer type
 * This is the foundation of the matching algorithm
 */
export const getMatchingMentors = async (cancerType: string): Promise<User[]> => {
    try {
        const usersRef = collection(FIREBASE_DB, 'users');
        const q = query(
            usersRef,
            where('role', '==', 'mentor'),
            where('cancerType', '==', cancerType)
        );

        const snapshot = await getDocs(q);
        const mentors: User[] = [];

        snapshot.forEach((doc) => {
            mentors.push({ ...doc.data() } as User);
        });

        console.log(`Found ${mentors.length} mentors with ${cancerType}`);
        return mentors;
    } catch (error) {
        console.error('Error fetching mentors:', error);
        return [];
    }
};

/**
 * Smart matching algorithm with fallback tiers
 * - Priority 1: Exact matches (cancer type + treatment type)
 * - Priority 2: Partial matches (cancer type only)
 * - Priority 3: All other users (so there's always someone to talk to)
 */
export const getMatchingUsers = async (
    currentUserRole: 'patient' | 'mentor',
    cancerType: string,
    treatmentType?: string
): Promise<User[]> => {
    try {
        const usersRef = collection(FIREBASE_DB, 'users');

        // If patient, show mentors; if mentor, show patients
        const targetRole = currentUserRole === 'patient' ? 'mentor' : 'patient';

        // Get ALL users with target role
        const q = query(usersRef, where('role', '==', targetRole));
        const snapshot = await getDocs(q);

        const allUsers: User[] = [];
        snapshot.forEach((doc) => {
            allUsers.push({ ...doc.data() } as User);
        });

        if (allUsers.length === 0) {
            console.log(`No ${targetRole}s found`);
            return [];
        }

        // Score each user based on match quality
        const scoredUsers = allUsers.map(user => {
            let score = 0;
            const matchDetails: string[] = [];

            // Priority 1: Cancer type match (highest priority)
            if (user.cancerType === cancerType) {
                score += 100;
                matchDetails.push('cancer type');
            }

            // Priority 2: Treatment type match
            if (treatmentType && user.treatmentType === treatmentType) {
                score += 50;
                matchDetails.push('treatment');
            }

            // Priority 3: Hobbies overlap
            // (This would require passing user hobbies, skipping for now)

            return { user, score, matchDetails };
        });

        // Sort by score (highest first)
        scoredUsers.sort((a, b) => b.score - a.score);

        // Extract just the users
        const sortedUsers = scoredUsers.map(item => item.user);

        // Log matching results
        const exactMatches = scoredUsers.filter(item => item.score >= 100).length;
        const partialMatches = scoredUsers.filter(item => item.score > 0 && item.score < 100).length;
        const noMatches = scoredUsers.filter(item => item.score === 0).length;

        console.log(`Matching results for ${targetRole}s:`);
        console.log(`  - Exact matches (cancer type): ${exactMatches}`);
        console.log(`  - Partial matches: ${partialMatches}`);
        console.log(`  - Other ${targetRole}s: ${noMatches}`);
        console.log(`  - Total: ${sortedUsers.length}`);

        return sortedUsers;
    } catch (error) {
        console.error('Error fetching matching users:', error);
        return [];
    }
};

/**
 * Get user by UID
 */
export const getUserByUid = async (uid: string): Promise<User | null> => {
    try {
        const usersRef = collection(FIREBASE_DB, 'users');
        const q = query(usersRef, where('uid', '==', uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No user found with UID: ${uid}`);
            return null;
        }

        return snapshot.docs[0].data() as User;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

/**
 * Get all users (for testing purposes)
 */
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const usersRef = collection(FIREBASE_DB, 'users');
        const snapshot = await getDocs(usersRef);
        const users: User[] = [];

        snapshot.forEach((doc) => {
            users.push({ ...doc.data() } as User);
        });

        console.log(`Found ${users.length} total users`);
        return users;
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
};

/**
 * Save user profile during onboarding
 */
export const saveUserProfile = async (userData: User): Promise<void> => {
    try {
        const userRef = doc(FIREBASE_DB, 'users', userData.uid);
        await setDoc(userRef, userData);
        console.log('✅ User profile saved successfully');
    } catch (error) {
        console.error('❌ Error saving user profile:', error);
        throw error;
    }
};
