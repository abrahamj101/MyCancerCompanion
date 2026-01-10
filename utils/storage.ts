import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Platform-agnostic storage wrapper
 * Uses AsyncStorage on mobile and localStorage on web
 */
export const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return null;
            }
        } else {
            return await AsyncStorage.getItem(key);
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        } else {
            await AsyncStorage.setItem(key, value);
        }
    },

    async removeItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        } else {
            await AsyncStorage.removeItem(key);
        }
    },
};
