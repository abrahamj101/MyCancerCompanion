import MentorCard from '@/components/MentorCard';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserProfile {
  name: string;
  age: string;
  cancerType: string;
  diagnosisDate: string;
  treatingHospital: string;
  bio: string;
  hobbies: string;
  image: string | null;
}

interface Mentor {
  id: string;
  name: string;
  age: number;
  cancerType: string;
  yearsSurvivor: string;
  bio: string;
  hobbies: string[];
  availability: string;
  connectionStatus: 'new' | 'pending' | 'connected';
}

// Initial mentors data
const initialMentors: Mentor[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 52,
    cancerType: 'Breast Cancer',
    yearsSurvivor: '5 Years',
    bio: 'You are stronger than you think. Every day is a victory.',
    hobbies: ['Reading', 'Yoga', 'Gardening'],
    availability: 'Available for Chat',
    connectionStatus: 'new',
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 48,
    cancerType: 'Lung Cancer',
    yearsSurvivor: '3 Years',
    bio: 'Take it one day at a time. You\'ve got this!',
    hobbies: ['Cooking', 'Photography', 'Hiking'],
    availability: 'Available for Chat',
    connectionStatus: 'new',
  },
  {
    id: '3',
    name: 'Patricia Williams',
    age: 65,
    cancerType: 'Breast Cancer',
    yearsSurvivor: '8 Years',
    bio: 'Survivorship is a journey, not a destination. Let\'s walk together.',
    hobbies: ['Knitting', 'Book Club', 'Volunteering'],
    availability: 'Available for Chat',
    connectionStatus: 'new',
  },
  {
    id: '4',
    name: 'Robert Martinez',
    age: 59,
    cancerType: 'Prostate Cancer',
    yearsSurvivor: '4 Years',
    bio: 'Hope is the anchor that keeps us steady during the storm.',
    hobbies: ['Fishing', 'Woodworking', 'Golf'],
    availability: 'Available for Chat',
    connectionStatus: 'new',
  },
  {
    id: '5',
    name: 'Linda Anderson',
    age: 61,
    cancerType: 'Ovarian Cancer',
    yearsSurvivor: '6 Years',
    bio: 'Your story isn\'t over yet. Turn the page and keep writing.',
    hobbies: ['Painting', 'Meditation', 'Travel'],
    availability: 'Available for Chat',
    connectionStatus: 'new',
  },
];

export default function CommunityScreen() {
  const [mentors, setMentors] = useState<Mentor[]>(initialMentors);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    age: '55',
    cancerType: 'Lung Cancer',
    diagnosisDate: '2024-01-15',
    treatingHospital: 'City Medical Center',
    bio: 'Fighting strong since 2023!',
    hobbies: 'Knitting, Hiking',
    image: null,
  });

  const handleRequestConnection = (mentorId: string) => {
    setMentors(
      mentors.map((mentor) =>
        mentor.id === mentorId
          ? { ...mentor, connectionStatus: 'pending' as const }
          : mentor
      )
    );
    Alert.alert('Connection Request Sent!', 'Your request has been sent to the mentor. They will respond soon.');
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Image Picker function
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an image!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUserProfile({ ...userProfile, image: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with User Profile button */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Find a Mentor</Text>
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          className="p-2 min-h-[44px] min-w-[44px] justify-center items-center">
          <User size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          <Text className="text-lg text-gray-600 mb-4">
            Connect 1-on-1 with survivors who share your journey
          </Text>

          {/* My Card Section */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <Text className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wide">
              My Card
            </Text>
            <View className="flex-row items-start">
              {userProfile.image ? (
                <Image
                  source={{ uri: userProfile.image }}
                  className="w-16 h-16 rounded-full mr-3"
                  style={{ width: 64, height: 64 }}
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <User size={24} color="#2563eb" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  {userProfile.name}
                </Text>
                <View className="px-3 py-1 bg-pink-100 rounded-full self-start mb-2">
                  <Text className="text-sm font-semibold text-pink-800">
                    {userProfile.cancerType}
                  </Text>
                </View>
                {userProfile.bio && (
                  <Text className="text-base text-gray-700 italic mb-2">
                    "{userProfile.bio}"
                  </Text>
                )}
                {userProfile.hobbies && (
                  <View className="flex-row flex-wrap">
                    {userProfile.hobbies.split(',').map((hobby, index) => {
                      const trimmedHobby = hobby.trim();
                      if (!trimmedHobby) return null;
                      return (
                        <View
                          key={`hobby-${index}-${trimmedHobby}`} 
                          className="px-2 py-1 bg-gray-100 rounded-full mr-2 mb-1">
                          <Text className="text-sm text-gray-700">{trimmedHobby}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>

          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onRequestConnection={handleRequestConnection}
            />
          ))}

          <View className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <Text className="text-lg text-gray-700 text-center">
              Looking for a specific type of mentor?{'\n'}
              <Text className="font-semibold text-blue-600">
                Contact us to find your perfect match
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* User Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-gray-900">User Profile</Text>
                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  className="px-4 py-2 min-h-[44px] justify-center">
                  <Text className="text-lg font-medium text-blue-600">Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Picture */}
                <View className="items-center mb-6">
                  <TouchableOpacity
                    onPress={pickImage}
                    className="relative">
                    {userProfile.image ? (
                      <Image
                        source={{ uri: userProfile.image }}
                        className="w-24 h-24 rounded-full"
                        style={{ width: 96, height: 96 }}
                      />
                    ) : (
                      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
                        <User size={40} color="#2563eb" />
                      </View>
                    )}
                    <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white">
                      <Camera size={16} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                  <Text className="text-sm text-gray-600 mt-2">Tap to change photo</Text>
                </View>

                <Text className="text-base font-semibold text-gray-700 mb-2">Name</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="Your name"
                  value={userProfile.name}
                  onChangeText={(text) => setUserProfile({ ...userProfile, name: text })}
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Age</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="Your age"
                  value={userProfile.age}
                  onChangeText={(text) => setUserProfile({ ...userProfile, age: text })}
                  keyboardType="numeric"
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Cancer Type</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="e.g., Lung Cancer"
                  value={userProfile.cancerType}
                  onChangeText={(text) => setUserProfile({ ...userProfile, cancerType: text })}
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Diagnosis Date</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="YYYY-MM-DD"
                  value={userProfile.diagnosisDate}
                  onChangeText={(text) => setUserProfile({ ...userProfile, diagnosisDate: text })}
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Treating Hospital</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="Hospital name"
                  value={userProfile.treatingHospital}
                  onChangeText={(text) => setUserProfile({ ...userProfile, treatingHospital: text })}
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Quick Note / Bio</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[100px] bg-white"
                  placeholder="Share a brief message about your journey..."
                  value={userProfile.bio}
                  onChangeText={(text) => setUserProfile({ ...userProfile, bio: text })}
                  multiline={true}
                  textAlignVertical="top"
                />

                <Text className="text-base font-semibold text-gray-700 mb-2">Hobbies</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                  placeholder="e.g., Knitting, Hiking, Reading"
                  value={userProfile.hobbies}
                  onChangeText={(text) => setUserProfile({ ...userProfile, hobbies: text })}
                />

                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  className="bg-blue-600 rounded-lg py-3 px-4 mt-4 min-h-[44px] justify-center active:bg-blue-700">
                  <Text className="text-lg font-semibold text-white text-center">Save Profile</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}