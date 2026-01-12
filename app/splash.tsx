import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { storage } from '../utils/storage';

export default function SplashScreen() {
    const router = useRouter();
    const [tapCount, setTapCount] = useState(0);

    useEffect(() => {
        // Show splash for 2.5 seconds, then navigate to welcome
        const timer = setTimeout(() => {
            router.replace('/welcome');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Reset tap count after 2 seconds of no taps
    useEffect(() => {
        if (tapCount > 0) {
            const resetTimer = setTimeout(() => setTapCount(0), 2000);
            return () => clearTimeout(resetTimer);
        }
    }, [tapCount]);

    const handleLogoPress = async () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        // Triple tap to reset
        if (newCount === 3) {
            Alert.alert(
                'Reset App Data?',
                'This will clear all local data and sign you out. Your profile in the cloud will remain safe.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                            await storage.removeItem('userUID');
                            await storage.removeItem('onboardingCompletedForUID');
                            Alert.alert('Reset Complete', 'App data cleared. Reloading...', [
                                {
                                    text: 'OK',
                                    onPress: () => router.replace('/welcome')
                                }
                            ]);
                        }
                    }
                ]
            );
            setTapCount(0);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
            <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.9}>
                <Image
                    source={require('../MyCancerCompanion APP LOGO.png')}
                    style={{ width: 450, height: 450 }}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </View>
    );
}
