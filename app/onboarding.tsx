import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import OnboardingLayout from '../components/OnboardingLayout';
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
        bio: '',
        building: 'Sweetwater Pavilion',
        floor: '1'
    });

    const totalSteps = 11; // Added location step

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
                availableToChat: true, // Default to available
                createdAt: new Date(),
                building: formData.building,
                floor: formData.floor
            });

            // Save to storage for persistence (store UID to track which user completed it)
            await storage.setItem('onboardingCompletedForUID', user.uid);
            console.log('✅ Onboarding completed for UID:', user.uid);

            // Update global state to prevent infinite loop
            setProfileComplete(true);

            // Refresh auth context to update actualUserId
            await refreshAuth();

            router.replace('/(tabs)/three');
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
        <OnboardingLayout
            currentStep={step}
            totalSteps={totalSteps}
            onBack={step > 1 ? handleBack : undefined}
            onNext={handleNext}
            nextButtonText={step === totalSteps ? 'Complete Profile' : 'Continue'}
        >
            <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                {/* Step 1: First Name */}
                {step === 1 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            What's your first name?
                        </Text>
                        <Text className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            We only use first names for privacy
                        </Text>
                        <TextInput
                            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl px-6 py-5 text-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Enter your first name"
                            placeholderTextColor="#9CA3AF"
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                            autoFocus
                            style={{ fontSize: 20 }}
                        />
                    </View>
                )}

                {/* Step 2: Role */}
                {step === 2 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            What's your role?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Are you seeking support or offering it?
                        </Text>
                        <TouchableOpacity
                            className={`border-3 rounded-2xl p-6 mb-4 ${formData.role === 'patient'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 bg-white'
                                }`}
                            onPress={() => setFormData({ ...formData, role: 'patient' })}
                            style={{
                                shadowColor: formData.role === 'patient' ? '#6366F1' : '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: formData.role === 'patient' ? 0.15 : 0.05,
                                shadowRadius: 4,
                                elevation: formData.role === 'patient' ? 4 : 2,
                            }}
                        >
                            <Text className={`text-xl font-bold mb-2 ${formData.role === 'patient' ? 'text-indigo-700' : 'text-gray-700'
                                }`}>
                                🙋 Patient
                            </Text>
                            <Text className={`text-base ${formData.role === 'patient' ? 'text-indigo-600' : 'text-gray-600'
                                }`}>
                                Seeking support and connection
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`border-3 rounded-2xl p-6 ${formData.role === 'mentor'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 bg-white'
                                }`}
                            onPress={() => setFormData({ ...formData, role: 'mentor' })}
                            style={{
                                shadowColor: formData.role === 'mentor' ? '#6366F1' : '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: formData.role === 'mentor' ? 0.15 : 0.05,
                                shadowRadius: 4,
                                elevation: formData.role === 'mentor' ? 4 : 2,
                            }}
                        >
                            <Text className={`text-xl font-bold mb-2 ${formData.role === 'mentor' ? 'text-indigo-700' : 'text-gray-700'
                                }`}>
                                🤝 Mentor
                            </Text>
                            <Text className={`text-base ${formData.role === 'mentor' ? 'text-indigo-600' : 'text-gray-600'
                                }`}>
                                Offering support to others
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 3: Cancer Type */}
                {step === 3 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Type of cancer?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Select the type that applies to you
                        </Text>
                        {CANCER_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`border-2 rounded-xl p-5 mb-3 ${formData.cancerType === type
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 bg-white'
                                    }`}
                                onPress={() => setFormData({ ...formData, cancerType: type })}
                            >
                                <Text className={`text-lg font-semibold ${formData.cancerType === type ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 4: Diagnosis Stage */}
                {step === 4 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Stage at diagnosis?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            e.g., "Stage 2" or "5 years survivor"
                        </Text>
                        <TextInput
                            className="border-2 border-gray-300 rounded-xl px-6 py-5 text-xl bg-white"
                            placeholder="Enter diagnosis stage"
                            placeholderTextColor="#9CA3AF"
                            value={formData.diagnosisStage}
                            onChangeText={(text) => setFormData({ ...formData, diagnosisStage: text })}
                            autoFocus
                            style={{ fontSize: 20 }}
                        />
                    </View>
                )}

                {/* Step 5: Treatment Type */}
                {step === 5 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Type of treatment?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Select all that apply
                        </Text>
                        {TREATMENT_TYPES.map((treatment) => (
                            <TouchableOpacity
                                key={treatment}
                                className={`border-2 rounded-xl p-5 mb-3 ${formData.treatmentType.includes(treatment)
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 bg-white'
                                    }`}
                                onPress={() => toggleTreatment(treatment)}
                            >
                                <Text className={`text-lg font-semibold ${formData.treatmentType.includes(treatment) ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                    {formData.treatmentType.includes(treatment) ? '✓ ' : ''}{treatment}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 6: Age Range */}
                {step === 6 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Your age range?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            This helps with matching (kept private)
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {AGE_RANGES.map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    className={`border-2 rounded-xl px-6 py-4 ${formData.ageRange === range
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-300 bg-white'
                                        }`}
                                    onPress={() => setFormData({ ...formData, ageRange: range })}
                                    style={{ minWidth: '45%' }}
                                >
                                    <Text className={`text-lg font-semibold text-center ${formData.ageRange === range ? 'text-indigo-700' : 'text-gray-700'
                                        }`}>
                                        {range}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 7: Recurrences */}
                {step === 7 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Any recurrences?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Has the cancer returned?
                        </Text>
                        {['No', 'Yes, once', 'Yes, multiple'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                className={`border-2 rounded-xl p-5 mb-3 ${formData.recurrences === option
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 bg-white'
                                    }`}
                                onPress={() => setFormData({ ...formData, recurrences: option })}
                            >
                                <Text className={`text-lg font-semibold ${formData.recurrences === option ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 8: Support Needs (Both Roles) */}
                {step === 8 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            {formData.role === 'patient'
                                ? 'What support do you need?'
                                : 'How can you help others?'}
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            {formData.role === 'patient'
                                ? 'Select all that apply'
                                : 'Select the types of support you can offer'}
                        </Text>
                        {SUPPORT_NEEDS.map((need) => (
                            <TouchableOpacity
                                key={need}
                                className={`border-2 rounded-xl p-5 mb-3 ${formData.supportNeeds.includes(need)
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 bg-white'
                                    }`}
                                onPress={() => toggleSupportNeed(need)}
                            >
                                <Text className={`text-lg font-semibold ${formData.supportNeeds.includes(need) ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                    {formData.supportNeeds.includes(need) ? '✓ ' : ''}{need}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 9: Hobbies */}
                {step === 9 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Hobbies & Interests?
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Separate with commas (e.g., Reading, Yoga, Gardening)
                        </Text>
                        <TextInput
                            className="border-2 border-gray-300 rounded-xl px-6 py-5 text-xl bg-white"
                            placeholder="Enter hobbies"
                            placeholderTextColor="#9CA3AF"
                            value={formData.hobbies}
                            onChangeText={(text) => setFormData({ ...formData, hobbies: text })}
                            multiline
                            autoFocus
                            style={{ fontSize: 20, minHeight: 100 }}
                        />
                    </View>
                )}

                {/* Step 10: Bio */}
                {step === 10 && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Tell us about yourself
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Share a bit about your journey (max 200 characters)
                        </Text>
                        <TextInput
                            className="border-2 border-gray-300 rounded-xl px-6 py-5 text-xl bg-white"
                            placeholder="e.g., Fighting strong since 2023!"
                            placeholderTextColor="#9CA3AF"
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text.slice(0, 200) })}
                            multiline
                            maxLength={200}
                            autoFocus
                            style={{ fontSize: 20, minHeight: 120 }}
                        />
                        <Text className="text-gray-500 text-base mt-3 text-right">
                            {formData.bio.length}/200
                        </Text>
                    </View>
                )}

                {/* Step 11: Location (Optional) */}
                {step === totalSteps && (
                    <View className="py-4">
                        <Text className="text-3xl font-bold text-gray-900 mb-3">
                            Your location (Optional)
                        </Text>
                        <Text className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Help others find you if you're nearby for in-person support
                        </Text>

                        <Text className="text-base font-semibold text-gray-700 mb-2">Building</Text>
                        <TextInput
                            className="border-2 border-gray-300 rounded-xl px-6 py-5 text-xl bg-white mb-4"
                            placeholder="e.g., Sweetwater Pavilion"
                            placeholderTextColor="#9CA3AF"
                            value={formData.building}
                            onChangeText={(text) => setFormData({ ...formData, building: text })}
                            style={{ fontSize: 20 }}
                        />

                        <Text className="text-base font-semibold text-gray-700 mb-2">Floor</Text>
                        <TextInput
                            className="border-2 border-gray-300 rounded-xl px-6 py-5 text-xl bg-white"
                            placeholder="e.g., 1, 2, 3"
                            placeholderTextColor="#9CA3AF"
                            value={formData.floor}
                            onChangeText={(text) => setFormData({ ...formData, floor: text })}
                            keyboardType="default"
                            style={{ fontSize: 20 }}
                        />

                        <Text className="text-sm text-gray-500 mt-4 italic">
                            Default: 16655 Southwest Fwy, Sugar Land, TX 77479
                        </Text>
                    </View>
                )}
            </ScrollView>
        </OnboardingLayout>
    );
}
