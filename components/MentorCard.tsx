import { User } from '@/services/UserService';
import { ConnectionStatus } from '@/types';
import { Award, Heart, MessageCircle, UserCheck, UserMinus, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// HIPAA-compliant Mentor interface (extends Firebase User schema)
interface Mentor extends User {
  connectionStatus: ConnectionStatus;
  requestId?: string;
  chatId?: string;
  matchDetails?: string[]; // What attributes matched
  matchScore?: number; // Overall match score
}

interface MentorCardProps {
  mentor: Mentor;
  onRequestConnection: (mentorId: string) => void;
  onCancelRequest: (requestId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onChatPress: (mentorId: string, chatId?: string) => void;
}

// Helper function to determine badge color based on diagnosis stage
const getBadgeColor = (diagnosisStage: string) => {
  // Check if it's a survivor (contains "year" or "survivor")
  const isSurvivor = diagnosisStage.toLowerCase().includes('year') ||
    diagnosisStage.toLowerCase().includes('survivor');

  if (isSurvivor) {
    // Extract years if possible
    const years = parseInt(diagnosisStage);
    if (!isNaN(years) && years >= 5) {
      return { bg: 'bg-yellow-400', text: 'text-yellow-900' };
    }
    return { bg: 'bg-blue-400', text: 'text-blue-900' };
  }

  // For current patients (e.g., "Stage 2")
  return { bg: 'bg-purple-400', text: 'text-purple-900' };
};

const styles = StyleSheet.create({
  buttonBase: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});

export default function MentorCard({
  mentor,
  onRequestConnection,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onChatPress
}: MentorCardProps) {
  const badgeColors = getBadgeColor(mentor.diagnosisStage);

  // Debug log
  console.log(`MentorCard ${mentor.firstName}: status=${mentor.connectionStatus}, requestId=${mentor.requestId}`);

  // Render button based on connection status
  const renderButton = () => {
    console.log(`[SWITCH] ${mentor.firstName}: status="${mentor.connectionStatus}", type=${typeof mentor.connectionStatus}`);

    if (mentor.connectionStatus === 'none') {
      console.log(`[SWITCH] Rendering: Send Request button`);
      return (
        <TouchableOpacity
          onPress={() => onRequestConnection(mentor.uid)}
          style={[styles.buttonBase, { backgroundColor: '#2563eb' }]}>
          <View style={styles.buttonRow}>
            <UserCheck size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Send Request</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (mentor.connectionStatus === 'pending_sent') {
      console.log(`[SWITCH] Rendering: Cancel Request button`);
      return (
        <TouchableOpacity
          onPress={() => mentor.requestId && onCancelRequest(mentor.requestId)}
          style={[styles.buttonBase, { backgroundColor: '#f97316' }]}>
          <View style={styles.buttonRow}>
            <UserMinus size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Cancel Request</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (mentor.connectionStatus === 'pending_received') {
      return (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => mentor.requestId && onAcceptRequest(mentor.requestId)}
            style={[styles.buttonBase, { flex: 1, backgroundColor: '#16a34a', marginTop: 0 }]}>
            <View style={styles.buttonRow}>
              <UserCheck size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Accept</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => mentor.requestId && onRejectRequest(mentor.requestId)}
            style={[styles.buttonBase, { flex: 1, backgroundColor: '#dc2626', marginTop: 0 }]}>
            <View style={styles.buttonRow}>
              <X size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Reject</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    if (mentor.connectionStatus === 'connected') {
      return (
        <TouchableOpacity
          onPress={() => onChatPress(mentor.uid, mentor.chatId)}
          style={[styles.buttonBase, { backgroundColor: '#16a34a' }]}>
          <View style={styles.buttonRow}>
            <MessageCircle size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Chat Now</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Default fallback
    return (
      <View style={[styles.buttonBase, { backgroundColor: '#9ca3af' }]}>
        <View style={styles.buttonRow}>
          <Text style={[styles.buttonText, { marginLeft: 0 }]}>Loading...</Text>
        </View>
      </View>
    );
  };


  return (
    <View className="bg-white rounded-xl p-5 mb-4 border border-gray-200 shadow-sm">
      {/* Mentor Info - No Avatar (HIPAA Compliant) */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Text className="text-xl font-bold text-gray-900 mr-2">
            {mentor.firstName}
          </Text>
          {/* Age is HIDDEN per HIPAA requirements */}
        </View>

        {/* Diagnosis Stage Badge */}
        <View className="flex-row items-center mb-3">
          <View
            className={`px-3 py-1.5 rounded-full ${badgeColors.bg} mr-2 flex-row items-center`}>
            <Award size={16} color={badgeColors.text.includes('yellow') ? '#92400e' : badgeColors.text.includes('blue') ? '#1e3a8a' : '#581c87'} />
            <Text
              className={`text-sm font-semibold ml-1 ${badgeColors.text}`}>
              {mentor.diagnosisStage}
            </Text>
          </View>
          <View className="flex-row items-center">
            {(mentor.availableToChat ?? true) ? (
              <>
                <Heart size={16} color="#ef4444" />
                <Text className="text-lg text-gray-700 ml-1">
                  Available for Chat
                </Text>
              </>
            ) : (
              <>
                <Text className="text-lg text-gray-500 ml-1">
                  Not available to chat
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Location Info (if available) */}
      {(mentor.building || mentor.floor) && (
        <View className="mb-3 flex-row items-center">
          <View className="px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Text className="text-sm font-medium text-blue-800">
              📍 {mentor.building || 'Building not specified'}{mentor.floor ? `, Floor ${mentor.floor}` : ''}
            </Text>
          </View>
        </View>
      )}

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
            key={`${mentor.uid}-hobby-${index}`}
            className="px-3 py-1.5 bg-gray-100 rounded-full mr-2 mb-2">
            <Text className="text-base text-gray-700">{hobby}</Text>
          </View>
        ))}
      </View>

      {/* Match Details - What you have in common */}
      {
        mentor.matchDetails && mentor.matchDetails.length > 0 && (
          <View className="mb-3">
            <Text className="text-sm font-semibold text-green-700 mb-2">✓ You match on:</Text>
            <View className="flex-row flex-wrap">
              {mentor.matchDetails.map((detail, index) => (
                <View
                  key={`${mentor.uid}-match-${index}`}
                  className="px-3 py-1.5 bg-green-100 rounded-full mr-2 mb-2 border border-green-300">
                  <Text className="text-sm font-medium text-green-800">{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        )
      }

      {/* Action Buttons */}
      {renderButton()}
    </View >
  );
}
