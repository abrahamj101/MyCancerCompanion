/**
 * Shared Type Definitions for MyCancerCompanion
 * HIPAA-compliant types for user data, friend requests, and chats
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
    uid: string;
    firstName: string; // HIPAA: First name only
    email: string;
    role: 'patient' | 'mentor';
    ageRange: string;
    cancerType: string;
    diagnosisStage: string;
    treatmentType: string;
    recurrences: string;
    supportNeeds: string[];
    hobbies: string[];
    bio: string;
    profileComplete: boolean;
    createdAt: Timestamp | any;
}

// ============================================================================
// FRIEND REQUEST TYPES
// ============================================================================

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
    id: string; // Document ID in Firestore
    senderId: string; // UID of user who sent request
    senderFirstName: string; // HIPAA: First name only
    receiverId: string; // UID of user who receives request
    receiverFirstName: string; // HIPAA: First name only
    status: FriendRequestStatus;
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

export interface Connection {
    userId: string; // The other user's UID
    firstName: string; // HIPAA: First name only
    status: ConnectionStatus;
    chatId?: string; // Optional: Chat ID if connected
    connectedAt?: Timestamp | any;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface Chat {
    id: string; // Chat document ID (composite: userId1_userId2)
    participants: string[]; // Array of UIDs [uid1, uid2]
    participantNames: {
        [uid: string]: string; // Map UID to firstName
    };
    lastMessage: {
        text: string;
        createdAt: Timestamp | any;
        user: {
            _id: string;
            name: string;
        };
    } | null;
    lastMessageTime: Timestamp | any;
    createdAt: Timestamp | any;
}

export interface Message {
    _id: string;
    text: string;
    createdAt: Timestamp | Date | any;
    user: {
        _id: string; // UID
        name: string; // HIPAA: First name only
    };
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface MentorWithStatus extends User {
    connectionStatus: ConnectionStatus;
}

export interface ChatPreview {
    chatId: string;
    otherUserId: string;
    otherUserFirstName: string;
    lastMessage: string | null;
    lastMessageTime: Timestamp | any;
    unreadCount?: number; // Optional: for future implementation
}
