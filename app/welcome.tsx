import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo - BIGGER for elderly */}
                <View className="items-center mb-8">
                    <Image
                        source={require('../MyCancerCompanion APP LOGO.png')}
                        style={{ width: 360, height: 360 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Welcome Text */}
                <View className="items-center mb-10">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Welcome to
                    </Text>
                    <Text className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 text-center mb-4">
                        MyCancerCompanion
                    </Text>
                    <Text className="text-base text-gray-600 dark:text-gray-300 text-center leading-relaxed px-2">
                        Your journey to connection starts here.{'\n'}
                        Let's find your perfect match.
                    </Text>
                </View>

                {/* Features List - 3 Key Features mapping to App Tabs */}
                <View className="w-full mb-10">
                    <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
                        <View className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mr-3">
                            <Text className="text-xl">💙</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                Community Connection
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-300">
                                Connect with survivors who share your specific journey
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
                        <View className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mr-3">
                            <Text className="text-xl">📅</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                Care Management
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-300">
                                Organize your appointments and treatment schedule
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <View className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mr-3">
                            <Text className="text-xl">📝</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                Daily Health Log
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-300">
                                Track symptoms daily to help your doctor help you
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Get Started Button */}
                <View className="w-full px-4 mb-8">
                    <TouchableOpacity
                        onPress={() => router.push('/login')}
                        className="bg-indigo-600 dark:bg-indigo-500 rounded-2xl py-5 shadow-xl active:bg-indigo-700 dark:active:bg-indigo-600"
                        style={{
                            shadowColor: '#6366F1',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 10,
                        }}
                    >
                        <Text className="text-center text-white font-bold text-2xl">
                            Get Started →
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
                        Takes about 2 minutes to complete
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
