import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { getUserByUid, saveUserProfile } from '../services/UserService';
import { User } from '../types';

const CANCER_TYPES = [
    'Lung Cancer',
    'Breast Cancer',
    'Prostate Cancer',
    'Colorectal Cancer',
    'Melanoma',
    'Leukemia',
    'Lymphoma',
    'Pancreatic Cancer',
    'Other',
];

const AGE_RANGES = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+'];

const TREATMENT_TYPES = [
    'Chemotherapy',
    'Radiation',
    'Surgery',
    'Immunotherapy',
    'Hormone Therapy',
    'Targeted Therapy',
];

const SUPPORT_NEEDS = [
    'Peer Support',
    'Spiritual',
    'Practical Advice',
    'Emotional Support',
    'Hope/Inspiration',
    'Ask Me Anything',
    'Just Listening',
];

export default function ProfileEditScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        cancerType: '',
        diagnosisStage: '',
        treatmentType: [] as string[],
        ageRange: '',
        recurrences: '',
        supportNeeds: [] as string[],
        hobbies: '',
        bio: '',
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const currentUser = FIREBASE_AUTH.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to edit your profile.');
                router.back();
                return;
            }

            const user = await getUserByUid(currentUser.uid);
            if (!user || !user.profileComplete) {
                Alert.alert(
                    'Profile Incomplete',
                    'Please complete your profile first.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/onboarding'),
                        },
                    ]
                );
                return;
            }

            setUserData(user);

            // Parse treatmentType string back to array
            const treatmentArray = user.treatmentType
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0);

            setFormData({
                firstName: user.firstName,
                cancerType: user.cancerType,
                diagnosisStage: user.diagnosisStage,
                treatmentType: treatmentArray,
                ageRange: user.ageRange,
                recurrences: user.recurrences,
                supportNeeds: user.supportNeeds,
                hobbies: user.hobbies.join(', '),
                bio: user.bio,
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.firstName.trim()) {
                Alert.alert('Required', 'Please enter your first name');
                return;
            }
            if (!formData.cancerType) {
                Alert.alert('Required', 'Please select cancer type');
                return;
            }
            if (!formData.diagnosisStage.trim()) {
                Alert.alert('Required', 'Please enter diagnosis stage');
                return;
            }
            if (formData.treatmentType.length === 0) {
                Alert.alert('Required', 'Please select at least one treatment type');
                return;
            }
            if (!formData.ageRange) {
                Alert.alert('Required', 'Please select age range');
                return;
            }
            if (!formData.recurrences) {
                Alert.alert('Required', 'Please select recurrence status');
                return;
            }

            setSaving(true);

            const currentUser = FIREBASE_AUTH.currentUser;
            if (!currentUser || !userData) {
                Alert.alert('Error', 'No user logged in');
                return;
            }

            const hobbiesArray = formData.hobbies
                .split(',')
                .map((h) => h.trim())
                .filter((h) => h.length > 0);

            await saveUserProfile({
                ...userData,
                firstName: formData.firstName,
                cancerType: formData.cancerType,
                diagnosisStage: formData.diagnosisStage,
                treatmentType: formData.treatmentType.join(', '),
                ageRange: formData.ageRange,
                recurrences: formData.recurrences,
                supportNeeds: formData.supportNeeds,
                hobbies: hobbiesArray,
                bio: formData.bio,
            });

            Alert.alert('Success', 'Your profile has been updated!', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTreatment = (treatment: string) => {
        if (formData.treatmentType.includes(treatment)) {
            setFormData({
                ...formData,
                treatmentType: formData.treatmentType.filter((t) => t !== treatment),
            });
        } else {
            setFormData({
                ...formData,
                treatmentType: [...formData.treatmentType, treatment],
            });
        }
    };

    const toggleSupportNeed = (need: string) => {
        if (formData.supportNeeds.includes(need)) {
            setFormData({
                ...formData,
                supportNeeds: formData.supportNeeds.filter((n) => n !== need),
            });
        } else {
            setFormData({
                ...formData,
                supportNeeds: [...formData.supportNeeds, need],
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="text-gray-600 mt-4">Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="min-h-[44px] min-w-[44px] justify-center items-center">
                    <ArrowLeft size={24} color="#2563eb" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="min-h-[44px] min-w-[44px] justify-center items-center">
                    {saving ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                        <Save size={24} color="#2563eb" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                {/* First Name */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">First Name</Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        We only use first names for privacy
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                    />
                </View>

                {/* Role - Read Only */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Role</Text>
                    <View className="bg-gray-100 rounded-lg px-4 py-3">
                        <Text className="text-base text-gray-700">
                            {userData?.role === 'patient' ? 'Patient (Seeking Support)' : 'Mentor (Offering Support)'}
                        </Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">Role cannot be changed</Text>
                </View>

                {/* Cancer Type */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Cancer Type</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {CANCER_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`border-2 rounded-lg px-4 py-2 ${formData.cancerType === type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, cancerType: type })}>
                                <Text
                                    className={`text-sm ${formData.cancerType === type
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-gray-700'
                                        }`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Diagnosis Stage */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Diagnosis Stage</Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        e.g., "Stage 2" or "5 years survivor"
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        placeholder="Enter diagnosis stage"
                        value={formData.diagnosisStage}
                        onChangeText={(text) => setFormData({ ...formData, diagnosisStage: text })}
                    />
                </View>

                {/* Treatment Type */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Treatment Type</Text>
                    <Text className="text-sm text-gray-600 mb-3">Select all that apply</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {TREATMENT_TYPES.map((treatment) => (
                            <TouchableOpacity
                                key={treatment}
                                className={`border-2 rounded-lg px-4 py-2 ${formData.treatmentType.includes(treatment)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300'
                                    }`}
                                onPress={() => toggleTreatment(treatment)}>
                                <Text
                                    className={`text-sm ${formData.treatmentType.includes(treatment)
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-gray-700'
                                        }`}>
                                    {treatment}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Age Range */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Age Range</Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        This helps with matching (kept private)
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {AGE_RANGES.map((range) => (
                            <TouchableOpacity
                                key={range}
                                className={`border-2 rounded-lg px-4 py-2 ${formData.ageRange === range
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, ageRange: range })}>
                                <Text
                                    className={`text-sm ${formData.ageRange === range
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-gray-700'
                                        }`}>
                                    {range}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recurrences */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Recurrences</Text>
                    <Text className="text-sm text-gray-600 mb-3">Has the cancer returned?</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {['No', 'Yes, once', 'Yes, multiple'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                className={`border-2 rounded-lg px-4 py-2 ${formData.recurrences === option
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300'
                                    }`}
                                onPress={() => setFormData({ ...formData, recurrences: option })}>
                                <Text
                                    className={`text-sm ${formData.recurrences === option
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-gray-700'
                                        }`}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Support Needs (Patients Only) */}
                {userData?.role === 'patient' && (
                    <View className="mb-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                            Support Needs
                        </Text>
                        <Text className="text-sm text-gray-600 mb-3">Select all that apply</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {SUPPORT_NEEDS.map((need) => (
                                <TouchableOpacity
                                    key={need}
                                    className={`border-2 rounded-lg px-4 py-2 ${formData.supportNeeds.includes(need)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300'
                                        }`}
                                    onPress={() => toggleSupportNeed(need)}>
                                    <Text
                                        className={`text-sm ${formData.supportNeeds.includes(need)
                                            ? 'text-blue-500 font-semibold'
                                            : 'text-gray-700'
                                            }`}>
                                        {need}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Hobbies */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">
                        Hobbies & Interests
                    </Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        Separate with commas (e.g., Reading, Yoga, Gardening)
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        placeholder="Enter hobbies"
                        value={formData.hobbies}
                        onChangeText={(text) => setFormData({ ...formData, hobbies: text })}
                        multiline
                    />
                </View>

                {/* Bio */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Bio</Text>
                    <Text className="text-sm text-gray-600 mb-3">
                        Tell others a bit about yourself (max 200 characters)
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        placeholder="e.g., Fighting strong since 2023!"
                        value={formData.bio}
                        onChangeText={(text) =>
                            setFormData({ ...formData, bio: text.slice(0, 200) })
                        }
                        multiline
                        maxLength={200}
                    />
                    <Text className="text-gray-500 text-xs mt-1 text-right">
                        {formData.bio.length}/200
                    </Text>
                </View>

                {/* Save Button (Bottom) */}
                <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-4 mb-8"
                    onPress={handleSave}
                    disabled={saving}>
                    <Text className="text-center text-white font-semibold text-lg">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
