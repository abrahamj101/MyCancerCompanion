import { Award, Heart, MessageCircle } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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

interface MentorCardProps {
  mentor: Mentor;
  onRequestConnection: (mentorId: string) => void;
  onChatPress: (mentorId: string) => void;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to determine badge color based on years
const getBadgeColor = (yearsSurvivor: string) => {
  const years = parseInt(yearsSurvivor);
  if (years >= 5) {
    return { bg: 'bg-yellow-400', text: 'text-yellow-900' };
  }
  return { bg: 'bg-blue-400', text: 'text-blue-900' };
};

export default function MentorCard({ mentor, onRequestConnection, onChatPress }: MentorCardProps) {
  const badgeColors = getBadgeColor(mentor.yearsSurvivor);
  const initials = getInitials(mentor.name);

  const handleButtonPress = () => {
    if (mentor.connectionStatus === 'connected') {
      onChatPress(mentor.id);
    } else if (mentor.connectionStatus === 'new') {
      onRequestConnection(mentor.id);
    }
  };

  return (
    <View className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
      <View className="flex-row items-start mb-4">
        {/* Avatar with initials */}
        <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-4">
          <Text className="text-xl font-bold text-blue-700">
            {initials}
          </Text>
        </View>

        {/* Mentor Info */}
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-xl font-bold text-gray-900 mr-2">
              {mentor.name}
            </Text>
            <Text className="text-lg text-gray-600">
              {mentor.age}
            </Text>
          </View>

          {/* Years Survivor Badge */}
          <View className="flex-row items-center mb-3">
            <View
              className={`px-3 py-1.5 rounded-full ${badgeColors.bg} mr-2 flex-row items-center`}>
              <Award size={16} color={badgeColors.text.includes('yellow') ? '#92400e' : '#1e3a8a'} />
              <Text
                className={`text-sm font-semibold ml-1 ${badgeColors.text}`}>
                {mentor.yearsSurvivor}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Heart size={16} color="#ef4444" />
              <Text className="text-lg text-gray-700 ml-1">
                {mentor.availability}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bio */}
      <Text className="text-lg text-gray-700 mb-4 leading-6 italic">
        "{mentor.bio}"
      </Text>

      {/* Cancer Type Tag */}
      <View className="mb-3">
        <View className="px-3 py-2 bg-pink-100 rounded-full self-start">
          <Text className="text-base font-semibold text-pink-800">
            {mentor.cancerType}
          </Text>
        </View>
      </View>

      {/* Hobbies Tags */}
      <View className="flex-row flex-wrap mb-4">
        {mentor.hobbies.map((hobby, index) => (
          <View
            key={index}
            className="px-3 py-1.5 bg-gray-100 rounded-full mr-2 mb-2">
            <Text className="text-base text-gray-700">{hobby}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={handleButtonPress}
        disabled={mentor.connectionStatus === 'pending'}
        className={`mt-2 rounded-lg py-3 px-4 min-h-[44px] ${mentor.connectionStatus === 'new'
          ? 'bg-blue-600 active:bg-blue-700'
          : mentor.connectionStatus === 'pending'
            ? 'bg-gray-400'
            : 'bg-green-600 active:bg-green-700'
          }`}>
        <View className="flex-row items-center justify-center">
          <MessageCircle size={20} color="#ffffff" />
          <Text className="text-lg font-semibold text-white ml-2">
            {mentor.connectionStatus === 'new'
              ? 'Request Connection'
              : mentor.connectionStatus === 'pending'
                ? 'Pending...'
                : 'Chat Now'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

