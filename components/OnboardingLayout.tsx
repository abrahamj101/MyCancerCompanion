import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingLayoutProps {
    currentStep: number;
    totalSteps: number;
    onBack?: () => void;
    onSkip?: () => void;
    onNext: () => void;
    nextButtonText?: string;
    nextButtonDisabled?: boolean;
    showSkip?: boolean;
    children: React.ReactNode;
}

export default function OnboardingLayout({
    currentStep,
    totalSteps,
    onBack,
    onSkip,
    onNext,
    nextButtonText = 'Continue',
    nextButtonDisabled = false,
    showSkip = false,
    children,
}: OnboardingLayoutProps) {
    const progressPercentage = (currentStep / totalSteps) * 100;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
            {/* Compact Header with Small Progress Bar */}
            <View className="px-6 pt-2 pb-3 bg-white dark:bg-gray-900">
                {/* Top Navigation */}
                <View className="flex-row justify-between items-center mb-2">
                    {onBack ? (
                        <TouchableOpacity
                            onPress={onBack}
                            className="p-2 -ml-2 min-h-[44px] min-w-[44px] justify-center items-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={24} color={isDark ? '#E5E7EB' : '#374151'} strokeWidth={2.5} />
                        </TouchableOpacity>
                    ) : (
                        <View className="w-10" />
                    )}

                    {/* Step Counter and Small Progress Bar */}
                    <View className="flex-1 mx-3">
                        <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1 text-right">
                            Step {currentStep} of {totalSteps}
                        </Text>
                        {/* SMALL Solid Progress Bar - Tube Line */}
                        <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height: 8 }}>
                            <View
                                className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
                                style={{ width: `${progressPercentage}%`, height: 8 }}
                            />
                        </View>
                    </View>

                    {showSkip && onSkip ? (
                        <TouchableOpacity
                            onPress={onSkip}
                            className="px-3 py-2 min-h-[44px] justify-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium">Skip</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="w-10" />
                    )}
                </View>
            </View>

            {/* Content - Full Space */}
            <View className="flex-1">
                {children}
            </View>

            {/* Footer with Continue Button */}
            <View className="px-6 pb-6 pt-4 bg-white dark:bg-gray-900">
                <TouchableOpacity
                    onPress={onNext}
                    disabled={nextButtonDisabled}
                    className={`rounded-2xl py-5 shadow-lg ${nextButtonDisabled
                        ? 'bg-gray-300 dark:bg-gray-700'
                        : 'bg-indigo-600 dark:bg-indigo-500 active:bg-indigo-700 dark:active:bg-indigo-600'
                        }`}
                    style={{
                        shadowColor: nextButtonDisabled ? '#9CA3AF' : '#6366F1',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <Text className={`text-center font-bold text-xl ${nextButtonDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-white'
                        }`}>
                        {nextButtonText}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
