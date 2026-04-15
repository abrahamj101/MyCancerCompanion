import React from 'react';
import { Text, Pressable, ViewStyle, TextStyle, useColorScheme, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

interface AnimatedButtonProps {
    onPress: () => void;
    title?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'outline';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedButton({
    onPress,
    title,
    children,
    disabled = false,
    style,
    textStyle,
    variant = 'primary'
}: AnimatedButtonProps) {
    const scale = useSharedValue(1);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 400 });
    };

    const getBackgroundColor = () => {
        if (disabled) return colorScheme === 'dark' ? theme.surface : '#D1D5DB';
        switch (variant) {
            case 'secondary': return theme.secondary;
            case 'outline': return 'transparent';
            case 'primary':
            default:
                return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
        switch (variant) {
            case 'outline': return theme.primary;
            case 'secondary': return '#ffffff';
            case 'primary':
            default:
                return '#ffffff';
        }
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[
                {
                    backgroundColor: getBackgroundColor(),
                    paddingVertical: 18,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: variant === 'outline' ? 2 : 0,
                    borderColor: variant === 'outline' ? theme.primary : 'transparent',
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: disabled || variant === 'outline' ? 0 : 0.3,
                    shadowRadius: 10,
                    elevation: disabled || variant === 'outline' ? 0 : 8,
                },
                style,
                animatedStyle,
            ]}
        >
            {children ? (
                children
            ) : (
                <Text
                    style={[
                        {
                            color: getTextColor(),
                            fontSize: 20,
                            fontWeight: 'bold',
                        },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </AnimatedPressable>
    );
}
