import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../components/useColorScheme';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_DB } from '../firebaseConfig';
import { User } from '../types';

export default function AdminDashboardScreen() {
    const { userRole, isLoading } = useAuth();
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (!isLoading && userRole !== 'admin') {
            Alert.alert('Unauthorized', 'You do not have administrative privileges.');
            router.back();
        }
    }, [userRole, isLoading]);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const usersRef = collection(FIREBASE_DB, 'users');
        const q = query(
            usersRef,
            where('accountStatus', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users: User[] = [];
            snapshot.forEach((document) => {
                users.push(document.data() as User);
            });
            setPendingUsers(users);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching pending users:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load pending users.');
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleAction = async (userId: string, action: 'active' | 'rejected') => {
        try {
            const userRef = doc(FIREBASE_DB, 'users', userId);
            await updateDoc(userRef, { accountStatus: action });
            // We use snapshot listener so the UI will update optimistically immediately
        } catch (error) {
            console.error(`Error updating user status to ${action}:`, error);
            Alert.alert('Error', 'Could not update user status.');
        }
    };

    if (isLoading || loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
                <ActivityIndicator size="large" color="#488B8F" />
            </View>
        );
    }

    if (userRole !== 'admin') {
        return null;
    }

    const renderItem = ({ item }: { item: User }) => (
        <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.userInfo}>
                <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#000000' }]}>{item.firstName} ({item.role})</Text>
                <Text style={[styles.detail, { color: isDark ? '#CCCCCC' : '#666666' }]}>Email: {item.email}</Text>
                <Text style={[styles.detail, { color: isDark ? '#CCCCCC' : '#666666' }]}>Cancer Type: {item.cancerType}</Text>
                <Text style={[styles.detail, { color: isDark ? '#CCCCCC' : '#666666' }]}>Age Range: {item.ageRange}</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.button, styles.approveButton]} 
                    onPress={() => handleAction(item.uid, 'active')}
                >
                    <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.rejectButton]} 
                    onPress={() => handleAction(item.uid, 'rejected')}
                >
                    <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Admin Dashboard</Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>Pending Approvals</Text>
            </View>
            
            {pendingUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: isDark ? '#CCCCCC' : '#666666' }]}>No pending users to review.</Text>
                </View>
            ) : (
                <FlatList
                    data={pendingUsers}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 5,
    },
    listContent: {
        padding: 15,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        marginBottom: 15,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    detail: {
        fontSize: 14,
        marginBottom: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        marginRight: 10,
    },
    rejectButton: {
        backgroundColor: '#F44336',
        marginLeft: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    }
});
