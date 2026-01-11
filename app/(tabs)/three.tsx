import MentorCard from '@/components/MentorCard';
import { useAuth } from '@/context/AuthContext';
import { getConnectionStatus, sendFriendRequest } from '@/services/FriendRequestService';
import { User as UserType, getMatchingUsers, getUserByUid } from '@/services/UserService';
import { ConnectionStatus, MentorWithStatus } from '@/types';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Extended Mentor interface with request/chat IDs
interface Mentor extends MentorWithStatus {
  requestId?: string;
  chatId?: string;
}

export default function PeerSupportScreen() {
  const router = useRouter();
  const { actualUserId } = useAuth(); // Get the REAL user ID
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);

  // Fetch mentors from Firebase on mount
  useEffect(() => {
    loadCurrentUserAndMentors();
  }, []);

  const loadCurrentUserAndMentors = async () => {
    try {
      setLoading(true);

      // Get current user data using the REAL user ID from AsyncStorage
      if (!actualUserId) {
        Alert.alert('Error', 'You must be logged in to view peer support.');
        return;
      }

      const userData = await getUserByUid(actualUserId);
      if (!userData || !userData.profileComplete) {
        Alert.alert(
          'Profile Incomplete',
          'Please complete your profile to see peer support matches.',
          [
            {
              text: 'Complete Profile',
              onPress: () => router.replace('/onboarding'),
            },
          ]
        );
        return;
      }
      setCurrentUserData(userData);

      // Fetch matching users based on role (mentors see patients, patients see mentors)
      // Smart algorithm: exact matches first, then partial, then all others
      const fetchedMentors = await getMatchingUsers(
        userData.role,
        userData.cancerType,
        userData.treatmentType
      );

      // Get connection status for each mentor
      const mentorsWithStatus: Mentor[] = await Promise.all(
        fetchedMentors.map(async (mentor) => {
          const connectionInfo = await getConnectionStatus(actualUserId, mentor.uid);
          return {
            ...mentor,
            connectionStatus: connectionInfo.status,
            requestId: connectionInfo.requestId,
            chatId: connectionInfo.chatId,
          };
        })
      );

      setMentors(mentorsWithStatus);
    } catch (error) {
      console.error('Error loading mentors:', error);
      Alert.alert('Error', 'Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCurrentUserAndMentors();
    setRefreshing(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { cancelFriendRequest } = await import('@/services/FriendRequestService');
      await cancelFriendRequest(requestId);

      // Update local state to show "Request Connection" button again
      setMentors((prevMentors) =>
        prevMentors.map((m) =>
          m.requestId === requestId
            ? { ...m, connectionStatus: 'none' as ConnectionStatus, requestId: undefined }
            : m
        )
      );

      Alert.alert('Success', 'Connection request cancelled.');
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request. Please try again.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { acceptFriendRequest } = await import('@/services/FriendRequestService');
      const chatId = await acceptFriendRequest(requestId);

      // Update local state to show "Chat Now" button
      setMentors((prevMentors) =>
        prevMentors.map((m) =>
          m.requestId === requestId
            ? { ...m, connectionStatus: 'connected' as ConnectionStatus, chatId }
            : m
        )
      );

      Alert.alert('Success', 'Connection request accepted! You can now chat.');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { rejectFriendRequest } = await import('@/services/FriendRequestService');
      await rejectFriendRequest(requestId);

      // Update local state to show "Request Connection" button again
      setMentors((prevMentors) =>
        prevMentors.map((m) =>
          m.requestId === requestId
            ? { ...m, connectionStatus: 'none' as ConnectionStatus, requestId: undefined }
            : m
        )
      );

      Alert.alert('Success', 'Connection request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  };

  const handleRequestConnection = async (mentorId: string) => {
    try {
      const mentor = mentors.find((m) => m.uid === mentorId);
      if (!mentor) return;

      if (!actualUserId || !currentUserData) {
        Alert.alert('Error', 'You must be logged in to connect with mentors.');
        return;
      }

      // Send friend request
      const requestId = await sendFriendRequest(
        actualUserId,
        currentUserData.firstName,
        mentorId,
        mentor.firstName
      );

      // Update local state to show "pending_sent"
      setMentors((prevMentors) =>
        prevMentors.map((m) =>
          m.uid === mentorId
            ? { ...m, connectionStatus: 'pending_sent' as ConnectionStatus, requestId }
            : m
        )
      );

      Alert.alert(
        'Request Sent!',
        `Your connection request has been sent to ${mentor.firstName}. You'll be notified when they accept.`
      );
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.message === 'Friend request already exists') {
        Alert.alert('Already Sent', 'You have already sent a request to this mentor.');
      } else {
        Alert.alert('Error', 'Failed to send connection request. Please try again.');
      }
    }
  };

  const handleChatPress = async (mentorId: string, existingChatId?: string) => {
    try {
      let chatId = existingChatId;

      if (!chatId) {
        // Auto-connect / Bypass friend request
        const mentor = mentors.find((m) => m.uid === mentorId);
        if (!mentor || !currentUserData || !actualUserId) return;

        const { createOrGetChat } = await import('@/services/ChatService');

        console.log(`Creating instant chat with ${mentor.firstName}...`);
        chatId = await createOrGetChat(
          actualUserId,  // Use the REAL user ID
          mentor.uid,
          currentUserData.firstName,
          mentor.firstName
        );

        // Update local state
        setMentors((prev) =>
          prev.map((m) =>
            m.uid === mentorId
              ? { ...m, connectionStatus: 'connected', chatId }
              : m
          )
        );

        console.log(`Chat created/retrieved: ${chatId}`);
      }

      router.push({
        pathname: '/chat/[id]',
        params: { id: chatId },
      } as any);

    } catch (error) {
      console.error("Error entering chat:", error);
      Alert.alert("Error", "Could not open chat.");
    }
  };

  const handleProfilePress = () => {
    router.push('/profile-edit');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Peer Support</Text>
        <TouchableOpacity
          onPress={handleProfilePress}
          className="p-2 min-h-[44px] min-w-[44px] justify-center items-center">
          <User size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        <View className="px-4 pt-4 pb-6">
          {/* Disclaimer */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
            <Text className="text-sm font-semibold text-blue-800 mb-1">
              💙 Peer Support, Not Medical Advice
            </Text>
            <Text className="text-sm text-gray-700">
              Connect 1-on-1 with survivors who share your journey. This is for emotional support and shared experiences.
            </Text>
          </View>

          {/* Loading State */}
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-600 mt-4">Loading mentors...</Text>
            </View>
          ) : mentors.length === 0 ? (
            /* Empty State */
            <View className="py-20 items-center">
              <Text className="text-xl font-bold text-gray-900 mb-2">No Mentors Found</Text>
              <Text className="text-gray-600 text-center px-8">
                We couldn't find any mentors matching your profile. Check back soon!
              </Text>
            </View>
          ) : (
            /* Mentors List with Match Quality Sections */
            <>
              {/* Calculate match groups */}
              {(() => {
                const bestMatches = mentors.filter(m =>
                  m.cancerType === currentUserData?.cancerType &&
                  m.treatmentType === currentUserData?.treatmentType
                );
                const goodMatches = mentors.filter(m =>
                  m.cancerType === currentUserData?.cancerType &&
                  m.treatmentType !== currentUserData?.treatmentType
                );
                const otherMatches = mentors.filter(m =>
                  m.cancerType !== currentUserData?.cancerType
                );

                return (
                  <>
                    {/* Best Matches Section */}
                    {bestMatches.length > 0 && (
                      <>
                        <View className="flex-row items-center mb-3">
                          <Text className="text-lg font-bold text-green-700">⭐ Best Matches</Text>
                          <View className="ml-2 px-2 py-1 bg-green-100 rounded-full">
                            <Text className="text-xs font-semibold text-green-800">{bestMatches.length}</Text>
                          </View>
                        </View>
                        <Text className="text-sm text-gray-600 mb-4">
                          Same cancer type and treatment
                        </Text>
                        {bestMatches.map((mentor) => (
                          <MentorCard
                            key={`${mentor.uid}-${mentor.connectionStatus}-${mentor.requestId || 'none'}`}
                            mentor={mentor}
                            onRequestConnection={handleRequestConnection}
                            onCancelRequest={handleCancelRequest}
                            onAcceptRequest={handleAcceptRequest}
                            onRejectRequest={handleRejectRequest}
                            onChatPress={handleChatPress}
                          />
                        ))}
                      </>
                    )}

                    {/* Good Matches Section */}
                    {goodMatches.length > 0 && (
                      <>
                        <View className="flex-row items-center mb-3 mt-6">
                          <Text className="text-lg font-bold text-blue-700">💙 Good Matches</Text>
                          <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
                            <Text className="text-xs font-semibold text-blue-800">{goodMatches.length}</Text>
                          </View>
                        </View>
                        <Text className="text-sm text-gray-600 mb-4">
                          Same cancer type
                        </Text>
                        {goodMatches.map((mentor) => (
                          <MentorCard
                            key={`${mentor.uid}-${mentor.connectionStatus}-${mentor.requestId || 'none'}`}
                            mentor={mentor}
                            onRequestConnection={handleRequestConnection}
                            onCancelRequest={handleCancelRequest}
                            onAcceptRequest={handleAcceptRequest}
                            onRejectRequest={handleRejectRequest}
                            onChatPress={handleChatPress}
                          />
                        ))}
                      </>
                    )}

                    {/* Other Connections Section */}
                    {otherMatches.length > 0 && (
                      <>
                        <View className="flex-row items-center mb-3 mt-6">
                          <Text className="text-lg font-bold text-gray-700">🤝 Other Connections</Text>
                          <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
                            <Text className="text-xs font-semibold text-gray-800">{otherMatches.length}</Text>
                          </View>
                        </View>
                        <Text className="text-sm text-gray-600 mb-4">
                          Different cancer types, but here to support
                        </Text>
                        {otherMatches.map((mentor) => (
                          <MentorCard
                            key={`${mentor.uid}-${mentor.connectionStatus}-${mentor.requestId || 'none'}`}
                            mentor={mentor}
                            onRequestConnection={handleRequestConnection}
                            onCancelRequest={handleCancelRequest}
                            onAcceptRequest={handleAcceptRequest}
                            onRejectRequest={handleRejectRequest}
                            onChatPress={handleChatPress}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}

              {/* Footer */}
              <View className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <Text className="text-lg text-gray-700 text-center">
                  Looking for a specific type of mentor?{'\n'}
                  <Text className="font-semibold text-blue-600">
                    Contact us to find your perfect match
                  </Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}