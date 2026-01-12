import { useAuth } from '@/context/AuthContext';
import { createOrGetChat } from '@/services/ChatService';
import { getUserByUid } from '@/services/UserService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_DB } from '../../firebaseConfig';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { actualUserId } = useAuth();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [currentUserFirstName, setCurrentUserFirstName] = useState<string>('User');
    const [mentorFirstName, setMentorFirstName] = useState<string>('');
    const [chatId, setChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch current user's firstName from Firestore
    useLayoutEffect(() => {
        const loadCurrentUser = async () => {
            if (!actualUserId) {
                console.warn('⚠️ No actualUserId available');
                return;
            }

            console.log('👤 Loading current user:', actualUserId);
            const userData = await getUserByUid(actualUserId);
            if (userData) {
                console.log('✅ Current user loaded:', userData.firstName);
                setCurrentUserFirstName(userData.firstName);
            } else {
                console.warn('⚠️ Current user profile not found for:', actualUserId);
                // Fallback: Use "Guest" to prevent crashes
                setCurrentUserFirstName('Guest');
            }
        };
        loadCurrentUser();
    }, [actualUserId]);

    // Fetch mentor's firstName
    useLayoutEffect(() => {
        const loadMentor = async () => {
            if (id) {
                let targetUid = id;
                // If ID is composite (contains underscore), extract the OTHER uid
                if (id.includes('_') && actualUserId) {
                    const parts = id.split('_');
                    targetUid = parts.find(part => part !== actualUserId) || id;
                    console.log('🔗 Composite ID detected. Target Mentor UID:', targetUid);
                }

                console.log('👤 Loading mentor:', targetUid);
                const mentorData = await getUserByUid(targetUid);
                if (mentorData) {
                    console.log('✅ Mentor loaded:', mentorData.firstName);
                    setMentorFirstName(mentorData.firstName);
                } else {
                    console.warn('⚠️ Mentor profile not found for:', targetUid);
                }
            }
        };
        loadMentor();
    }, [id, actualUserId]);

    // Initialize Chat
    useLayoutEffect(() => {
        const initChat = async () => {
            if (!actualUserId) {
                console.warn('⚠️ Cannot init chat: actualUserId is null');
                return;
            }

            // Scenario 1: We already have a valid composite Chat ID passed in params
            if (id && id.includes('_')) {
                // Just wait for names to load for valid UI, but we can set ID immediately
                if (chatId !== id) {
                    console.log('🔗 Using existing Chat ID from params:', id);
                    setChatId(id);
                    setIsLoading(false);
                }
                return;
            }

            // Scenario 2: We have a Mentor UID and need to generate/get the Chat ID
            console.log('🔄 Checking Chat Init Conditions:', {
                hasActualUserId: !!actualUserId,
                idParam: id,
                currentName: currentUserFirstName,
                mentorName: mentorFirstName
            });

            if (actualUserId && id && !id.includes('_') && currentUserFirstName !== 'User' && mentorFirstName) {
                console.log('🚀 Conditions met, initializing chat...');
                try {
                    const resolvedChatId = await createOrGetChat(
                        actualUserId,
                        id,
                        currentUserFirstName,
                        mentorFirstName
                    );
                    console.log('✅ Chat ID resolved:', resolvedChatId);
                    setChatId(resolvedChatId);
                    setIsLoading(false);
                } catch (error) {
                    console.error('❌ Error initializing chat:', error);
                    setIsLoading(false);
                }
            } else {
                // Only log "Stalled" if we are NOT in Scenario 1 (which handles itself)
                // and if we are waiting on data.
                if (id && !id.includes('_')) {
                    const missing = [];
                    if (!actualUserId) missing.push('actualUserId');
                    if (currentUserFirstName === 'User') missing.push('currentUserFirstName ("User")');
                    if (!mentorFirstName) missing.push('mentorFirstName (empty)');
                    console.log('⏳ Waiting for conditions (Creation Mode)... Missing:', missing.join(', '));
                }
            }
        };
        initChat();
    }, [id, actualUserId, currentUserFirstName, mentorFirstName]);

    useLayoutEffect(() => {
        // Reference to the messages subcollection for this chat
        if (!chatId) return;

        const messagesRef = collection(FIREBASE_DB, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        // Listen to real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    _id: doc.id,
                    text: data.text,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    user: {
                        _id: data.user._id,
                        name: data.user.name, // Already firstName only from Firebase
                    },
                } as IMessage;
            });
            setMessages(fetchedMessages);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [chatId]);

    const onSend = useCallback(
        async (newMessages: IMessage[] = []) => {
            console.log('🚀 onSend triggered with:', newMessages.length, 'messages');
            if (!chatId) {
                console.error('❌ onSend aborted: chatId is null');
                return;
            }

            console.log('📝 Sending to chat:', chatId);
            const messagesRef = collection(FIREBASE_DB, 'chats', chatId, 'messages');

            // Send each message to Firestore
            for (const message of newMessages) {
                const messageData = {
                    _id: message._id,
                    text: message.text,
                    createdAt: message.createdAt,
                    user: {
                        _id: message.user._id,
                        name: currentUserFirstName, // Use firstName only (HIPAA)
                    },
                };
                console.log('📦 Message payload:', JSON.stringify(messageData, null, 2));

                try {
                    await addDoc(messagesRef, messageData);
                    console.log('✅ Message added to Firestore subcollection');

                    // Update the chat's lastMessage field
                    const { updateLastMessage } = await import('@/services/ChatService');
                    console.log('🔄 Updating lastMessage in ChatService...');
                    await updateLastMessage(
                        chatId,
                        message.text,
                        message.user._id.toString(),
                        currentUserFirstName
                    );
                } catch (error) {
                    console.error('❌ Error sending message:', error);
                }
            }
        },
        [chatId, currentUserFirstName]
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
            {/* Custom Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mr-3 min-h-[44px] min-w-[44px] justify-center items-center">
                    <ArrowLeft size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {mentorFirstName || 'Chat'}
                </Text>
            </View>

            {/* Chat Messages */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <GiftedChat
                    messages={messages}
                    onSend={(messages) => onSend(messages)}
                    user={{
                        _id: actualUserId || 'anonymous',
                        name: currentUserFirstName, // Use firstName only (HIPAA)
                    }}
                    renderAvatar={null} // Hide avatars (HIPAA)
                    minInputToolbarHeight={60}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
