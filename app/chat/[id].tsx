import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../firebaseConfig';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const chatId = id || 'default';

    useLayoutEffect(() => {
        // Reference to the messages subcollection for this chat
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
                        name: data.user.name,
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
            const messagesRef = collection(FIREBASE_DB, 'chats', chatId, 'messages');

            // Send each message to Firestore
            for (const message of newMessages) {
                await addDoc(messagesRef, {
                    _id: message._id,
                    text: message.text,
                    createdAt: message.createdAt,
                    user: {
                        _id: message.user._id,
                        name: message.user.name || 'User',
                    },
                });
            }
        },
        [chatId]
    );

    const currentUser = FIREBASE_AUTH.currentUser;

    return (
        <View className="flex-1 bg-white">
            <GiftedChat
                messages={messages}
                onSend={(messages) => onSend(messages)}
                user={{
                    _id: currentUser?.uid || 'anonymous',
                    name: currentUser?.displayName || 'User',
                }}
                renderAvatar={null} // Hide avatars
                alwaysShowSend
                scrollToBottom
                showUserAvatar={false}
            />
            {Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />}
        </View>
    );
}
