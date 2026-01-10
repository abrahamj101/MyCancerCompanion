import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebaseConfig';

/**
 * ChatService - Handles chat creation and management
 */

/**
 * Create or get a chat between two users
 * @param patientUid - Patient's Firebase UID
 * @param mentorUid - Mentor's Firebase UID
 * @param patientFirstName - Patient's first name
 * @param mentorFirstName - Mentor's first name
 * @returns chatId
 */
export const createOrGetChat = async (
    patientUid: string,
    mentorUid: string,
    patientFirstName: string,
    mentorFirstName: string
): Promise<string> => {
    try {
        // Use composite key: sorted UIDs to ensure consistency
        const sortedIds = [patientUid, mentorUid].sort();
        const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
        const chatRef = doc(FIREBASE_DB, 'chats', chatId);

        // Check if chat already exists
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            // Create new chat document
            await setDoc(chatRef, {
                participants: [patientUid, mentorUid],
                participantNames: {
                    [patientUid]: patientFirstName,
                    [mentorUid]: mentorFirstName,
                },
                lastMessage: null,
                lastMessageTime: serverTimestamp(),
                createdAt: serverTimestamp(),
            });

            console.log(`Created new chat: ${chatId}`);
        } else {
            console.log(`Chat already exists: ${chatId}`);
        }

        return chatId;
    } catch (error) {
        console.error('Error creating/getting chat:', error);
        throw error;
    }
};

/**
 * Update the lastMessage field in a chat document
 * @param chatId - Chat document ID
 * @param messageText - Text of the last message
 * @param senderUid - UID of the sender
 * @param senderFirstName - First name of the sender
 */
export const updateLastMessage = async (
    chatId: string,
    messageText: string,
    senderUid: string,
    senderFirstName: string
): Promise<void> => {
    console.log(`[ChatService] Updating last message for ${chatId}`);
    try {
        const chatRef = doc(FIREBASE_DB, 'chats', chatId);

        await setDoc(
            chatRef,
            {
                lastMessage: {
                    text: messageText,
                    createdAt: serverTimestamp(),
                    user: {
                        _id: senderUid,
                        name: senderFirstName,
                    },
                },
                lastMessageTime: serverTimestamp(),
            },
            { merge: true }
        );
        console.log('[ChatService] ✅ Last message updated successfully');
    } catch (error) {
        console.error('[ChatService] ❌ Error updating last message:', error);
    }
};

/**
 * @returns chatId or null
 */
export const getChatIdForUsers = async (
    userId1: string,
    userId2: string
): Promise<string | null> => {
    try {
        // Try both possible composite keys
        const chatId1 = `${userId1}_${userId2}`;
        const chatId2 = `${userId2}_${userId1}`;

        const chatRef1 = doc(FIREBASE_DB, 'chats', chatId1);
        const chatRef2 = doc(FIREBASE_DB, 'chats', chatId2);

        const [chatDoc1, chatDoc2] = await Promise.all([
            getDoc(chatRef1),
            getDoc(chatRef2),
        ]);

        if (chatDoc1.exists()) {
            return chatId1;
        }
        if (chatDoc2.exists()) {
            return chatId2;
        }

        return null;
    } catch (error) {
        console.error('Error getting chat ID:', error);
        return null;
    }
};

/**
 * Get all chats for a user
 * @param userId - User's UID
 * @returns Array of chat documents
 */
export const getUserChats = async (userId: string): Promise<any[]> => {
    try {
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const chatsRef = collection(FIREBASE_DB, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        const snapshot = await getDocs(q);
        const chats: any[] = [];

        snapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Found ${chats.length} chats for user ${userId}`);
        return chats;
    } catch (error) {
        console.error('Error fetching user chats:', error);
        return [];
    }
};

/**
 * Get the other participant in a chat
 * @param chatId - Chat document ID
 * @param currentUserId - Current user's UID
 * @returns Other user's UID and firstName
 */
export const getOtherParticipant = async (
    chatId: string,
    currentUserId: string
): Promise<{ uid: string; firstName: string } | null> => {
    try {
        const chatRef = doc(FIREBASE_DB, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            return null;
        }

        const chatData = chatDoc.data();
        const participants = chatData.participants as string[];
        const participantNames = chatData.participantNames as { [key: string]: string };

        // Find the other participant
        const otherUserId = participants.find((uid) => uid !== currentUserId);
        if (!otherUserId) {
            return null;
        }

        return {
            uid: otherUserId,
            firstName: participantNames[otherUserId],
        };
    } catch (error) {
        console.error('Error getting other participant:', error);
        return null;
    }
};
