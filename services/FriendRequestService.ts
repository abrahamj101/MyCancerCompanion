import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../firebaseConfig';
import { FriendRequest, FriendRequestStatus } from '../types';

/**
 * FriendRequestService - Handles all friend request operations
 * HIPAA-compliant: Only stores first names, no sensitive data
 */

// ============================================================================
// SEND FRIEND REQUEST
// ============================================================================

/**
 * Send a friend request from current user to another user
 * @param senderId - Current user's UID
 * @param senderFirstName - Current user's first name
 * @param receiverId - Target user's UID
 * @param receiverFirstName - Target user's first name
 * @returns FriendRequest document ID
 */
export const sendFriendRequest = async (
    senderId: string,
    senderFirstName: string,
    receiverId: string,
    receiverFirstName: string
): Promise<string> => {
    try {
        // Check if request already exists
        const existingRequest = await checkExistingRequest(senderId, receiverId);
        if (existingRequest) {
            throw new Error('Friend request already exists');
        }

        // Create new friend request
        const friendRequestsRef = collection(FIREBASE_DB, 'friendRequests');
        const docRef = await addDoc(friendRequestsRef, {
            senderId,
            senderFirstName,
            receiverId,
            receiverFirstName,
            status: 'pending' as FriendRequestStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(`✅ Friend request sent: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error sending friend request:', error);
        throw error;
    }
};

// ============================================================================
// CHECK EXISTING REQUEST
// ============================================================================

/**
 * Check if a friend request already exists between two users
 * @param userId1 - First user's UID
 * @param userId2 - Second user's UID
 * @returns Existing FriendRequest or null
 */
export const checkExistingRequest = async (
    userId1: string,
    userId2: string
): Promise<FriendRequest | null> => {
    try {
        const friendRequestsRef = collection(FIREBASE_DB, 'friendRequests');

        // Check both directions (user1 -> user2 OR user2 -> user1)
        const q1 = query(
            friendRequestsRef,
            where('senderId', '==', userId1),
            where('receiverId', '==', userId2),
            where('status', '==', 'pending')
        );

        const q2 = query(
            friendRequestsRef,
            where('senderId', '==', userId2),
            where('receiverId', '==', userId1),
            where('status', '==', 'pending')
        );

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snapshot1.empty) {
            const doc = snapshot1.docs[0];
            return { id: doc.id, ...doc.data() } as FriendRequest;
        }

        if (!snapshot2.empty) {
            const doc = snapshot2.docs[0];
            return { id: doc.id, ...doc.data() } as FriendRequest;
        }

        return null;
    } catch (error) {
        console.error('❌ Error checking existing request:', error);
        return null;
    }
};

// ============================================================================
// GET PENDING REQUESTS (RECEIVED)
// ============================================================================

/**
 * Get all pending friend requests received by a user
 * @param userId - User's UID
 * @returns Array of pending FriendRequests
 */
export const getPendingReceivedRequests = async (userId: string): Promise<FriendRequest[]> => {
    try {
        const friendRequestsRef = collection(FIREBASE_DB, 'friendRequests');
        const q = query(
            friendRequestsRef,
            where('receiverId', '==', userId),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        const requests: FriendRequest[] = [];

        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });

        console.log(`📥 Found ${requests.length} pending received requests`);
        return requests;
    } catch (error) {
        console.error('❌ Error fetching pending received requests:', error);
        return [];
    }
};

// ============================================================================
// GET PENDING REQUESTS (SENT)
// ============================================================================

/**
 * Get all pending friend requests sent by a user
 * @param userId - User's UID
 * @returns Array of pending FriendRequests
 */
export const getPendingSentRequests = async (userId: string): Promise<FriendRequest[]> => {
    try {
        const friendRequestsRef = collection(FIREBASE_DB, 'friendRequests');
        const q = query(
            friendRequestsRef,
            where('senderId', '==', userId),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        const requests: FriendRequest[] = [];

        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });

        console.log(`📤 Found ${requests.length} pending sent requests`);
        return requests;
    } catch (error) {
        console.error('❌ Error fetching pending sent requests:', error);
        return [];
    }
};

// ============================================================================
// ACCEPT FRIEND REQUEST
// ============================================================================

/**
 * Accept a friend request and create a chat
 * @param requestId - FriendRequest document ID
 * @returns Chat ID
 */
export const acceptFriendRequest = async (requestId: string): Promise<string> => {
    try {
        // Get the friend request
        const requestRef = doc(FIREBASE_DB, 'friendRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            throw new Error('Friend request not found');
        }

        const request = { id: requestDoc.id, ...requestDoc.data() } as FriendRequest;

        // Update request status to 'accepted'
        await updateDoc(requestRef, {
            status: 'accepted' as FriendRequestStatus,
            updatedAt: serverTimestamp(),
        });

        // Create chat between the two users
        const { createOrGetChat } = await import('./ChatService');
        const chatId = await createOrGetChat(
            request.senderId,
            request.receiverId,
            request.senderFirstName,
            request.receiverFirstName
        );

        console.log(`✅ Friend request accepted, chat created: ${chatId}`);
        return chatId;
    } catch (error) {
        console.error('❌ Error accepting friend request:', error);
        throw error;
    }
};

// ============================================================================
// REJECT FRIEND REQUEST
// ============================================================================

/**
 * Reject a friend request
 * @param requestId - FriendRequest document ID
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
    try {
        const requestRef = doc(FIREBASE_DB, 'friendRequests', requestId);

        await updateDoc(requestRef, {
            status: 'rejected' as FriendRequestStatus,
            updatedAt: serverTimestamp(),
        });

        console.log(`✅ Friend request rejected: ${requestId}`);
    } catch (error) {
        console.error('❌ Error rejecting friend request:', error);
        throw error;
    }
};

// ============================================================================
// CANCEL FRIEND REQUEST
// ============================================================================

/**
 * Cancel a sent friend request (delete it)
 * @param requestId - FriendRequest document ID
 */
export const cancelFriendRequest = async (requestId: string): Promise<void> => {
    try {
        const requestRef = doc(FIREBASE_DB, 'friendRequests', requestId);
        await deleteDoc(requestRef);

        console.log(`✅ Friend request cancelled: ${requestId}`);
    } catch (error) {
        console.error('❌ Error cancelling friend request:', error);
        throw error;
    }
};

// ============================================================================
// GET CONNECTION STATUS
// ============================================================================

/**
 * Get the connection status between current user and another user
 * @param currentUserId - Current user's UID
 * @param otherUserId - Other user's UID
 * @returns ConnectionStatus
 */
export const getConnectionStatus = async (
    currentUserId: string,
    otherUserId: string
): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
    requestId?: string;
    chatId?: string;
}> => {
    try {
        // Check for existing friend request
        const existingRequest = await checkExistingRequest(currentUserId, otherUserId);

        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                // They're connected, get chat ID
                const { getChatIdForUsers } = await import('./ChatService');
                const chatId = await getChatIdForUsers(currentUserId, otherUserId);
                return { status: 'connected', chatId: chatId || undefined };
            } else if (existingRequest.status === 'pending') {
                // Check who sent the request
                if (existingRequest.senderId === currentUserId) {
                    return { status: 'pending_sent', requestId: existingRequest.id };
                } else {
                    return { status: 'pending_received', requestId: existingRequest.id };
                }
            }
        }

        // Check if chat exists (they might be connected without a friend request)
        const { getChatIdForUsers } = await import('./ChatService');
        const chatId = await getChatIdForUsers(currentUserId, otherUserId);
        if (chatId) {
            return { status: 'connected', chatId };
        }

        return { status: 'none' };
    } catch (error) {
        console.error('❌ Error getting connection status:', error);
        return { status: 'none' };
    }
};
