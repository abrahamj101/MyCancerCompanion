import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, isLoading: authLoading } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailAuth = async () => {
        // Validation
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email.trim(), password);
                // signUpWithEmail handles navigation
            } else {
                await signInWithEmail(email.trim(), password);
                // signInWithEmail handles navigation
            }
        } catch (error: any) {
            console.error('❌ Auth error:', error);
            let message = 'An error occurred. Please try again.';

            // Firebase error codes
            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered. Try signing in instead.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email. Try creating one.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many attempts. Please try again later.';
            } else if (error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password. Please check and try again.';
            }

            Alert.alert('Authentication Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            // signInWithGoogle handles navigation
        } catch (error: any) {
            console.error('❌ Google sign-in error:', error);
            if (error.message !== 'Google sign-in cancelled') {
                Alert.alert('Google Sign-In Error', error.message || 'Failed to sign in with Google.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = isLoading || authLoading;

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* App Logo */}
                    <View className="items-center mb-6">
                        <Image
                            source={require('../MyCancerCompanion APP LOGO.png')}
                            style={{ width: 180, height: 180 }}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <View className="items-center mb-8">
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </Text>
                        <Text className="text-base text-gray-600 dark:text-gray-300 text-center mt-2">
                            {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</Text>
                        <TextInput
                            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="you@example.com"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isButtonDisabled}
                        />
                    </View>

                    {/* Password Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</Text>
                        <TextInput
                            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isButtonDisabled}
                        />
                    </View>

                    {/* Confirm Password (Sign Up Only) */}
                    {isSignUp && (
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</Text>
                            <TextInput
                                className="border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isButtonDisabled}
                            />
                        </View>
                    )}

                    {/* Email Auth Button */}
                    <TouchableOpacity
                        onPress={handleEmailAuth}
                        disabled={isButtonDisabled}
                        className={`rounded-xl py-4 mb-4 ${isButtonDisabled ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                        style={{
                            shadowColor: '#6366F1',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-center text-white font-bold text-lg">
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Toggle Sign In/Up */}
                    <TouchableOpacity
                        onPress={() => setIsSignUp(!isSignUp)}
                        disabled={isButtonDisabled}
                        className="mb-6"
                    >
                        <Text className="text-center text-indigo-600 dark:text-indigo-400 text-base">
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center mb-6">
                        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        <Text className="mx-4 text-gray-500 dark:text-gray-400 text-sm">Or continue with</Text>
                        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                    </View>

                    {/* Google Sign-In Button */}
                    <TouchableOpacity
                        onPress={handleGoogleSignIn}
                        disabled={isButtonDisabled}
                        className={`flex-row items-center justify-center rounded-xl py-4 border-2 ${isButtonDisabled ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'}`}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <Text className="text-2xl mr-3">🔵</Text>
                        <Text className={`font-semibold text-lg ${isButtonDisabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            Sign in with Google
                        </Text>
                    </TouchableOpacity>

                    {/* Back to Welcome */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={isButtonDisabled}
                        className="mt-6"
                    >
                        <Text className="text-center text-gray-500 dark:text-gray-400 text-sm">
                            ← Back to Welcome
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
