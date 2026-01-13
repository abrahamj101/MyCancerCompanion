import { ChevronRight, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface TutorialModalProps {
    visible: boolean;
    role: 'patient' | 'mentor';
    onClose: () => void;
}

interface TutorialStep {
    title: string;
    description: string;
    emoji: string;
}

const patientSteps: TutorialStep[] = [
    {
        emoji: '👋',
        title: 'Welcome to Peer Support!',
        description: 'Connect with cancer survivors who understand your journey. This tab shows people matched to your profile based on cancer type, treatment, and support needs.',
    },
    {
        emoji: '⭐',
        title: 'How Matching Works',
        description: 'We match you with mentors and peers based on:\n• Cancer type\n• Treatment type\n• Support needs\n• Hobbies and interests\n\nBest matches appear at the top!',
    },
    {
        emoji: '📤',
        title: 'Send a Request',
        description: 'Tap "Send Request" on any card to connect. Pull down to refresh and see when they accept. You can cancel pending requests anytime.',
    },
    {
        emoji: '💬',
        title: 'Start Chatting',
        description: 'Once someone accepts your request, a green "Chat Now" button appears. Tap it to start a private 1-on-1 conversation!',
    },
    {
        emoji: '✏️',
        title: 'Edit Your Profile',
        description: 'Tap the person icon in the top-right to update your bio, hobbies, and other details. This helps you get better matches.',
    },
    {
        emoji: '🔒',
        title: 'Privacy Controls',
        description: 'In your profile, you can toggle "Available to Chat" to hide yourself from others when you need a break. Your existing chats stay active.',
    },
];

const mentorSteps: TutorialStep[] = [
    {
        emoji: '💚',
        title: 'Welcome, Volunteer!',
        description: 'Thank you for offering your time and support. You\'ll see patients who match your experience with cancer type, treatment, and interests.',
    },
    {
        emoji: '👥',
        title: 'Your Matches',
        description: 'Patients are matched to you based on:\n• Your cancer type and stage\n• Treatment experience\n• Shared hobbies\n\nYou can send requests or wait for incoming requests.',
    },
    {
        emoji: '✅',
        title: 'Accept Requests',
        description: 'When a patient sends you a request, you\'ll see "Accept" and "Reject" buttons. Pull down to refresh and see new requests.',
    },
    {
        emoji: '💬',
        title: 'Start Chatting',
        description: 'After accepting, a green "Chat Now" button appears. Tap it to start supporting them through their journey.',
    },
    {
        emoji: '✏️',
        title: 'Edit Your Profile',
        description: 'Tap the person icon to update your bio and details. Share your story to help patients feel comfortable reaching out.',
    },
];

export default function TutorialModal({ visible, role, onClose }: TutorialModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = role === 'mentor' ? mentorSteps : patientSteps;
    const isLastStep = currentStep === steps.length - 1;

    // Debug logging
    React.useEffect(() => {
        console.log('[TutorialModal] visible:', visible, 'role:', role, 'steps:', steps.length);
    }, [visible, role]);

    const handleNext = () => {
        if (isLastStep) {
            onClose();
            setCurrentStep(0); // Reset for next time
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSkip = () => {
        onClose();
        setCurrentStep(0);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleSkip}>
            <View className="flex-1 bg-black/70 justify-center items-center px-4">
                <View className="bg-white rounded-3xl p-6 w-full max-w-md">
                    {/* Close button */}
                    <TouchableOpacity
                        onPress={handleSkip}
                        className="absolute top-4 right-4 z-10 p-2"
                        style={{ minHeight: 44, minWidth: 44 }}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>

                    {/* Content */}
                    <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
                        <View className="items-center mb-6">
                            <Text className="text-6xl mb-4">{steps[currentStep].emoji}</Text>
                            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                                {steps[currentStep].title}
                            </Text>
                            <Text className="text-base text-gray-700 text-center leading-6">
                                {steps[currentStep].description}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Progress dots */}
                    <View className="flex-row justify-center mb-6 gap-2">
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full ${index === currentStep
                                    ? 'bg-blue-600 w-8'
                                    : 'bg-gray-300 w-2'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        {!isLastStep && (
                            <TouchableOpacity
                                onPress={handleSkip}
                                className="flex-1 py-3 px-4 rounded-lg border border-gray-300"
                                style={{ minHeight: 44 }}>
                                <Text className="text-base font-semibold text-gray-700 text-center">
                                    Skip
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={handleNext}
                            className={`py-3 px-4 rounded-lg bg-blue-600 flex-row items-center justify-center ${isLastStep ? 'flex-1' : 'flex-1'
                                }`}
                            style={{ minHeight: 44 }}>
                            <Text className="text-base font-semibold text-white mr-2">
                                {isLastStep ? 'Get Started' : 'Next'}
                            </Text>
                            {!isLastStep && <ChevronRight size={20} color="#ffffff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
