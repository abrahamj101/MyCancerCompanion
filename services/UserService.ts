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
 * Comprehensive matching algorithm with primary and secondary factors
 * PRIMARY (50 points each): Cancer type, Treatment type, Support needs
 * SECONDARY (10 points each): Hobbies, Age range, Diagnosis stage similarity, Recurrence status
 */
export const getMatchingUsers = async (
    currentUserRole: 'patient' | 'mentor',
    cancerType: string,
    treatmentType?: string,
    supportNeeds?: string[],
    hobbies?: string[],
    ageRange?: string,
    diagnosisStage?: string,
    recurrences?: string
): Promise<Array<User & { matchDetails: string[]; matchScore: number }>> => {
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

        // Filter to only show users who are available to chat (default to true if not set)
        const availableUsers = allUsers.filter(user => user.availableToChat !== false);

        if (availableUsers.length === 0) {
            console.log(`No available ${targetRole}s found`);
            return [];
        }

        // Score each user based on match quality
        const scoredUsers = availableUsers.map(user => {
            let score = 0;
            const matchDetails: string[] = [];

            // === PRIMARY FACTORS (50 points each) ===

            // Factor 1: Cancer type match
            if (user.cancerType === cancerType) {
                score += 50;
                matchDetails.push('Same cancer type');
            }

            // Factor 2: Treatment type match
            if (treatmentType && user.treatmentType === treatmentType) {
                score += 50;
                matchDetails.push('Same treatment');
            }

            // Factor 3: Support needs overlap
            if (supportNeeds && supportNeeds.length > 0 && user.supportNeeds && user.supportNeeds.length > 0) {
                const overlap = supportNeeds.filter(need => user.supportNeeds?.includes(need));
                if (overlap.length > 0) {
                    const overlapScore = Math.min(50, overlap.length * 10);
                    score += overlapScore;
                    matchDetails.push(`${overlap.length} support match${overlap.length > 1 ? 'es' : ''}`);
                }
            }

            // === SECONDARY FACTORS (10 points each) ===

            // Factor 4: Hobbies overlap
            if (hobbies && hobbies.length > 0 && user.hobbies && user.hobbies.length > 0) {
                const hobbyOverlap = hobbies.filter(hobby =>
                    user.hobbies?.some(userHobby =>
                        userHobby.toLowerCase().includes(hobby.toLowerCase()) ||
                        hobby.toLowerCase().includes(userHobby.toLowerCase())
                    )
                );
                if (hobbyOverlap.length > 0) {
                    score += Math.min(10, hobbyOverlap.length * 3);
                    matchDetails.push(`${hobbyOverlap.length} shared hobby${hobbyOverlap.length > 1 ? 'ies' : ''}`);
                }
            }

            // Factor 5: Age range match
            if (ageRange && user.ageRange === ageRange) {
                score += 10;
                matchDetails.push('Similar age');
            }

            // Factor 6: Diagnosis stage similarity
            if (diagnosisStage && user.diagnosisStage) {
                // Check if both contain "Stage" and same number, or both are survivors
                const isSurvivor = diagnosisStage.toLowerCase().includes('survivor') || diagnosisStage.toLowerCase().includes('year');
                const userIsSurvivor = user.diagnosisStage.toLowerCase().includes('survivor') || user.diagnosisStage.toLowerCase().includes('year');

                if (isSurvivor && userIsSurvivor) {
                    score += 10;
                    matchDetails.push('Both survivors');
                } else if (diagnosisStage.toLowerCase().includes('stage') && user.diagnosisStage.toLowerCase().includes('stage')) {
                    // Extract stage numbers and compare
                    const stageMatch = diagnosisStage.match(/\d+/);
                    const userStageMatch = user.diagnosisStage.match(/\d+/);
                    if (stageMatch && userStageMatch && stageMatch[0] === userStageMatch[0]) {
                        score += 10;
                        matchDetails.push('Same stage');
                    }
                }
            }

            // Factor 7: Recurrence status match
            if (recurrences && user.recurrences === recurrences) {
                score += 10;
                matchDetails.push('Similar recurrence history');
            }

            return {
                ...user,
                matchScore: score,
                matchDetails
            };
        });

        // Sort by score (highest first)
        scoredUsers.sort((a, b) => b.matchScore - a.matchScore);

        // Log matching results
        const perfectMatches = scoredUsers.filter(item => item.matchScore >= 120).length; // All primary + some secondary
        const greatMatches = scoredUsers.filter(item => item.matchScore >= 80 && item.matchScore < 120).length; // 2+ primary factors
        const goodMatches = scoredUsers.filter(item => item.matchScore >= 50 && item.matchScore < 80).length; // 1+ primary factors
        const partialMatches = scoredUsers.filter(item => item.matchScore > 0 && item.matchScore < 50).length; // Secondary factors only
        const noMatches = scoredUsers.filter(item => item.matchScore === 0).length;

        console.log(`Matching results for ${targetRole}s:`);
        console.log(`  - Perfect matches (120+ pts): ${perfectMatches}`);
        console.log(`  - Great matches (80-119 pts): ${greatMatches}`);
        console.log(`  - Good matches (50-79 pts): ${goodMatches}`);
        console.log(`  - Partial matches (1-49 pts): ${partialMatches}`);
        console.log(`  - Other ${targetRole}s (0 pts): ${noMatches}`);
        console.log(`  - Total: ${scoredUsers.length}`);

        return scoredUsers;
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
