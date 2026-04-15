import { useRouter } from 'expo-router';
import { serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { saveUserProfile } from '../services/UserService';
import { getUserByUid } from '../services/UserService';

export default function TermsAndConditionsScreen() {
    const router = useRouter();
    const { actualUserId } = useAuth();
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        if (!accepted) {
            Alert.alert(
                'Please Accept',
                'You must check the box to agree to the Terms & Conditions before continuing.'
            );
            return;
        }

        setLoading(true);
        try {
            const uid = actualUserId ?? FIREBASE_AUTH.currentUser?.uid;
            if (!uid) throw new Error('No authenticated user found.');

            // Fetch existing skeleton profile so we don't overwrite it
            const existing = await getUserByUid(uid);

            await saveUserProfile({
                ...(existing as any),
                uid,
                email: existing?.email ?? FIREBASE_AUTH.currentUser?.email ?? '',
                termsAccepted: true,
                termsAcceptedAt: serverTimestamp(),
            });

            router.replace('/onboarding');
        } catch (err) {
            console.error('[T&C] Failed to record acceptance:', err);
            Alert.alert('Error', 'Could not save your acceptance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            'Terms Declined',
            'You must accept the Terms & Conditions to use MyCancerCompanion.',
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <Text style={styles.headerSubtitle}>
                    Please read and accept before continuing
                </Text>
            </View>

            {/* Scrollable T&C Body */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                <Section title="1. Purpose of This App">
                    MyCancerCompanion connects cancer patients with peer mentors who have
                    lived experience. This platform is for peer support only and does not
                    provide medical advice, diagnosis, or treatment.
                </Section>

                <Section title="2. Privacy & HIPAA">
                    Your health information is protected. We collect only the minimum data
                    necessary for peer matching and display only your first name publicly.
                    Your data is stored securely in Firebase and is never sold to third
                    parties.
                </Section>

                <Section title="3. Code of Conduct">
                    Users must treat all community members with respect and dignity. Hate
                    speech, harassment, or sharing of another user's personal health
                    information is strictly prohibited and will result in immediate account
                    suspension.
                </Section>

                <Section title="4. Mentor Approval">
                    Mentor accounts are subject to admin review before activation. You will
                    be notified once your account is approved. During this time you may not
                    access the peer-support chat features.
                </Section>

                <Section title="5. Not a Crisis Service">
                    If you or someone you know is in crisis, please contact the National
                    Cancer Information Center at 1-800-227-2345 or call 911. This app is
                    not a substitute for professional mental health care.
                </Section>

                <Section title="6. Changes to Terms">
                    We may update these Terms from time to time. Continued use of the app
                    after changes constitutes acceptance of the updated Terms.
                </Section>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {/* Checkbox row */}
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAccepted(!accepted)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                        {accepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                        I have read and agree to the Terms & Conditions
                    </Text>
                </TouchableOpacity>

                {/* Accept button */}
                <TouchableOpacity
                    style={[styles.acceptBtn, !accepted && styles.acceptBtnDisabled]}
                    onPress={handleAccept}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.acceptBtnText}>
                        {loading ? 'Saving…' : 'Accept & Continue'}
                    </Text>
                </TouchableOpacity>

                {/* Decline link */}
                <TouchableOpacity onPress={handleDecline} style={styles.declineBtn}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionBody}>{children}</Text>
        </View>
    );
}

const PURPLE = '#6366F1';
const PURPLE_LIGHT = '#EEF2FF';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: PURPLE,
        paddingTop: 64,
        paddingBottom: 24,
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 12,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    sectionBody: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    footer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: PURPLE,
        borderColor: PURPLE,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 16,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    acceptBtn: {
        backgroundColor: PURPLE,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptBtnDisabled: {
        backgroundColor: '#A5B4FC',
        shadowOpacity: 0,
        elevation: 0,
    },
    acceptBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    declineBtn: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    declineBtnText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
});
