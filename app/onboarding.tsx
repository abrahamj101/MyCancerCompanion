import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { saveUserProfile } from '../services/UserService';
import { storage } from '../utils/storage';

type Role = 'patient' | 'mentor';

const CANCER_TYPES = [
    'Lung Cancer',
    'Breast Cancer',
    'Prostate Cancer',
    'Colorectal Cancer',
    'Melanoma',
    'Leukemia',
    'Lymphoma',
    'Pancreatic Cancer',
    'Other'
];

const AGE_RANGES = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+'];

const TREATMENT_TYPES = [
    'Chemotherapy',
    'Radiation',
    'Surgery',
    'Immunotherapy',
    'Hormone Therapy',
    'Targeted Therapy'
];

const SUPPORT_NEEDS = [
    'Peer Support',
    'Spiritual',
    'Practical Advice',
    'Emotional Support',
    'Hope/Inspiration',
    'Ask Me Anything',
    'Just Listening'
];

export default function OnboardingScreen() {
    const { setProfileComplete, refreshAuth } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        role: '' as Role | '',
        cancerType: '',
        diagnosisStage: '',
        treatmentType: [] as string[],
        ageRange: '',
        recurrences: '',
        supportNeeds: [] as string[],
        hobbies: '',
        bio: ''
    });

    const totalSteps = formData.role === 'patient' ? 10 : 9;

    const handleNext = () => {
        // Validation for each step
        if (step === 1 && !formData.firstName.trim()) {
            Alert.alert('Required', 'Please enter your first name');
            return;
        }
        if (step === 2 && !formData.role) {
            Alert.alert('Required', 'Please select your role');
            return;
        }
        if (step === 3 && !formData.cancerType) {
            Alert.alert('Required', 'Please select cancer type');
            return;
        }
        if (step === 4 && !formData.diagnosisStage.trim()) {
            Alert.alert('Required', 'Please enter diagnosis stage');
            return;
        }
        if (step === 5 && formData.treatmentType.length === 0) {
            Alert.alert('Required', 'Please select at least one treatment type');
            return;
        }
        if (step === 6 && !formData.ageRange) {
            Alert.alert('Required', 'Please select age range');
            return;
        }
        if (step === 7 && !formData.recurrences) {
            Alert.alert('Required', 'Please select recurrence status');
            return;
        }

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;
            if (!user) {
                Alert.alert('Error', 'No user logged in');
                return;
            }

            const hobbiesArray = formData.hobbies
                .split(',')
                .map(h => h.trim())
                .filter(h => h.length > 0);

            // Save to Firebase
            await saveUserProfile({
                uid: user.uid,
                firstName: formData.firstName,
                email: user.email || '',
                role: formData.role as Role,
                ageRange: formData.ageRange,
                cancerType: formData.cancerType,
                diagnosisStage: formData.diagnosisStage,
                treatmentType: formData.treatmentType.join(', '),
                recurrences: formData.recurrences,
                supportNeeds: formData.supportNeeds,
                hobbies: hobbiesArray,
                bio: formData.bio,
                profileComplete: true,
                createdAt: new Date()
            });

            // Save to storage for persistence (store UID to track which user completed it)
            await storage.setItem('onboardingCompletedForUID', user.uid);
            console.log('✅ Onboarding completed for UID:', user.uid);

            // Update global state to prevent infinite loop
            setProfileComplete(true);

            // Refresh auth context to update actualUserId
            await refreshAuth();

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        }
    };

    const toggleTreatment = (treatment: string) => {
        if (formData.treatmentType.includes(treatment)) {
            setFormData({
                ...formData,
                treatmentType: formData.treatmentType.filter(t => t !== treatment)
            });
        } else {
            setFormData({
                ...formData,
                treatmentType: [...formData.treatmentType, treatment]
            });
        }
    };

    const toggleSupportNeed = (need: string) => {
        if (formData.supportNeeds.includes(need)) {
            setFormData({
                ...formData,
                supportNeeds: formData.supportNeeds.filter(n => n !== need)
            });
        } else {
            setFormData({
                ...formData,
                supportNeeds: [...formData.supportNeeds, need]
            });
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Progress Bar */}
            <View className="bg-blue-500 pt-12 pb-4 px-6">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white text-lg font-semibold">
                        Step {step} of {totalSteps}
                    </Text>
                    {/* Diagnostic Button */}
                    <TouchableOpacity
                        onPress={async () => {
                            Alert.alert(
                                'Clear All Data?',
                                'This will clear all stored data and restart the app. You will need to complete onboarding again.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Clear & Restart',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await storage.removeItem('onboardingCompletedForUID');
                                            Alert.alert('Data Cleared', 'Please reload the app.');
                                        }
                                    }
                                ]
                            );
                        }}
                        className="bg-red-500/20 px-3 py-1 rounded">
                        <Text className="text-red-600 text-xs font-semibold">Reset</Text>
                    </TouchableOpacity>
                </View>
                <View className="h-2 bg-blue-300 rounded-full">
                    <View
                        className="h-2 bg-white rounded-full"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-8">
                {/* Step 1: First Name */}
                {step === 1 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">What is your first name?</Text>
                        <Text className="text-gray-600 mb-6">We only use first names for privacy</Text>
                        <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                            autoFocus
                        />
                    </View>
                )}

                {/* Step 2: Role */}
                {step === 2 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">What is your role?</Text>
                        <Text className="text-gray-600 mb-6">Are you seeking support or offering it?</Text>
                        <TouchableOpacity
                            className={`border-2 rounded-lg p-4 mb-3 ${formData.role === 'patient' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                }`}
                            onPress={() => setFormData({ ...formData, role: 'patient' })}
                        >
                            <Text className={`text-lg font-semibold ${formData.role === 'patient' ? 'text-blue-500' : 'text-gray-700'}`}>
                                Patient (Seeking Support)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`border-2 rounded-lg p-4 ${formData.role === 'mentor' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                }`}
                            onPress={() => setFormData({ ...formData, role: 'mentor' })}
                        >
                            <Text className={`text-lg font-semibold ${formData.role === 'mentor' ? 'text-blue-500' : 'text-gray-700'}`}>
                                Mentor (Offering Support)
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 3: Cancer Type */}
                {step === 3 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">What type of cancer?</Text>
                        <Text className="text-gray-600 mb-6">Select the type that applies to you</Text>
                        {CANCER_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`border-2 rounded-lg p-4 mb-3 ${formData.cancerType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, cancerType: type })}
                            >
                                <Text className={`text-lg ${formData.cancerType === type ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 4: Diagnosis Stage */}
                {step === 4 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Stage at diagnosis?</Text>
                        <Text className="text-gray-600 mb-6">e.g., "Stage 2" or "5 years survivor"</Text>
                        <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                            placeholder="Enter diagnosis stage"
                            value={formData.diagnosisStage}
                            onChangeText={(text) => setFormData({ ...formData, diagnosisStage: text })}
                            autoFocus
                        />
                    </View>
                )}

                {/* Step 5: Treatment Type */}
                {step === 5 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Type of treatment?</Text>
                        <Text className="text-gray-600 mb-6">Select all that apply</Text>
                        {TREATMENT_TYPES.map((treatment) => (
                            <TouchableOpacity
                                key={treatment}
                                className={`border-2 rounded-lg p-4 mb-3 ${formData.treatmentType.includes(treatment) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onPress={() => toggleTreatment(treatment)}
                            >
                                <Text className={`text-lg ${formData.treatmentType.includes(treatment) ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}>
                                    {treatment}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 6: Age Range */}
                {step === 6 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Age range?</Text>
                        <Text className="text-gray-600 mb-6">This helps with matching (kept private)</Text>
                        {AGE_RANGES.map((range) => (
                            <TouchableOpacity
                                key={range}
                                className={`border-2 rounded-lg p-4 mb-3 ${formData.ageRange === range ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, ageRange: range })}
                            >
                                <Text className={`text-lg ${formData.ageRange === range ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}>
                                    {range}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 7: Recurrences */}
                {step === 7 && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Recurrences?</Text>
                        <Text className="text-gray-600 mb-6">Has the cancer returned?</Text>
                        {['No', 'Yes, once', 'Yes, multiple'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                className={`border-2 rounded-lg p-4 mb-3 ${formData.recurrences === option ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, recurrences: option })}
                            >
                                <Text className={`text-lg ${formData.recurrences === option ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 8: Support Needs (Patients Only) */}
                {step === 8 && formData.role === 'patient' && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">What support do you need?</Text>
                        <Text className="text-gray-600 mb-6">Select all that apply</Text>
                        {SUPPORT_NEEDS.map((need) => (
                            <TouchableOpacity
                                key={need}
                                className={`border-2 rounded-lg p-4 mb-3 ${formData.supportNeeds.includes(need) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onPress={() => toggleSupportNeed(need)}
                            >
                                <Text className={`text-lg ${formData.supportNeeds.includes(need) ? 'text-blue-500 font-semibold' : 'text-gray-700'}`}>
                                    {need}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 9/8: Hobbies */}
                {step === (formData.role === 'patient' ? 9 : 8) && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Hobbies & Interests?</Text>
                        <Text className="text-gray-600 mb-6">Separate with commas (e.g., Reading, Yoga, Gardening)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                            placeholder="Enter hobbies"
                            value={formData.hobbies}
                            onChangeText={(text) => setFormData({ ...formData, hobbies: text })}
                            multiline
                            autoFocus
                        />
                    </View>
                )}

                {/* Step 10/9: Bio */}
                {step === totalSteps && (
                    <View>
                        <Text className="text-2xl font-bold mb-2">Short bio?</Text>
                        <Text className="text-gray-600 mb-6">Tell others a bit about yourself (max 200 characters)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                            placeholder="e.g., Fighting strong since 2023!"
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text.slice(0, 200) })}
                            multiline
                            maxLength={200}
                            autoFocus
                        />
                        <Text className="text-gray-500 text-sm mt-2 text-right">
                            {formData.bio.length}/200
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Navigation Buttons */}
            <View className="px-6 py-4 border-t border-gray-200">
                <View className="flex-row gap-3">
                    {step > 1 && (
                        <TouchableOpacity
                            className="flex-1 bg-gray-200 rounded-lg py-4"
                            onPress={handleBack}
                        >
                            <Text className="text-center text-gray-700 font-semibold text-lg">Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        className={`flex-1 bg-blue-500 rounded-lg py-4 ${step === 1 ? 'w-full' : ''}`}
                        onPress={handleNext}
                    >
                        <Text className="text-center text-white font-semibold text-lg">
                            {step === totalSteps ? 'Complete' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
