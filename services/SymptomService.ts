import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebaseConfig';
import { DailySymptomLog, SymptomEntry } from '../types';

/**
 * SymptomService - Handles all Firestore operations for symptom tracking
 * Collection: symptom_logs
 * Document ID: ${userId}_${YYYY-MM-DD}
 */

/**
 * Save or update daily symptom log
 * Uses merge: true to allow partial updates (e.g., updating just Nausea without erasing Fatigue)
 * 
 * @example
 * await logDailySymptom(
 *   'S6H3ioC6kwf66RmtB7MdiaeFdUP2',
 *   '2026-01-12',
 *   [
 *     { name: 'Nausea', severity: 8, notes: 'Worse after lunch' },
 *     { name: 'Fatigue', severity: 6, notes: '' }
 *   ],
 *   5
 * );
 */
export const logDailySymptom = async (
    userId: string,
    date: string, // YYYY-MM-DD
    symptomArray: SymptomEntry[],
    overallFeeling?: number
): Promise<void> => {
    try {
        // Create composite document ID
        const docId = `${userId}_${date}`;
        const docRef = doc(FIREBASE_DB, 'symptom_logs', docId);

        // Convert array to map for Firestore
        const symptomsMap: { [key: string]: { severity: number; notes?: string } } = {};
        symptomArray.forEach(symptom => {
            symptomsMap[symptom.name] = {
                severity: symptom.severity,
                notes: symptom.notes || ''
            };
        });

        const logData: DailySymptomLog = {
            userId,
            date,
            timestamp: Timestamp.now(),
            symptoms: symptomsMap,
            symptomArray: symptomArray,
            checkedSymptomCount: symptomArray.length,
            ...(overallFeeling !== undefined && { overallFeeling }) // Only include if defined
        };

        // merge: true allows updating just one symptom without deleting others
        await setDoc(docRef, logData, { merge: true });
        console.log(`✅ Symptom log saved for ${date}`);
    } catch (error) {
        console.error('❌ Error saving symptom log:', error);
        throw error;
    }
};

/**
 * Get symptom log for a specific date
 * 
 * @example
 * const log = await getLogForDate('S6H3ioC6kwf66RmtB7MdiaeFdUP2', '2026-01-12');
 * if (log) {
 *   console.log('Nausea severity:', log.symptoms.Nausea?.severity);
 * }
 */
export const getLogForDate = async (
    userId: string,
    date: string
): Promise<DailySymptomLog | null> => {
    try {
        const docId = `${userId}_${date}`;
        const docRef = doc(FIREBASE_DB, 'symptom_logs', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`✅ Found symptom log for ${date}`);
            return docSnap.data() as DailySymptomLog;
        } else {
            console.log(`ℹ️ No symptom log found for ${date}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching symptom log:', error);
        throw error;
    }
};

/**
 * Get symptom history for the last X days
 * Useful for AI summarization and trend graphs
 * 
 * @example
 * const history = await getHistory('S6H3ioC6kwf66RmtB7MdiaeFdUP2', 7);
 * console.log(`Found ${history.length} days of logs`);
 */
export const getHistory = async (
    userId: string,
    days: number = 7
): Promise<DailySymptomLog[]> => {
    try {
        const logsRef = collection(FIREBASE_DB, 'symptom_logs');
        const q = query(
            logsRef,
            where('userId', '==', userId),
            orderBy('date', 'desc'),
            limit(days)
        );

        const snapshot = await getDocs(q);
        const logs: DailySymptomLog[] = [];

        snapshot.forEach((doc) => {
            logs.push(doc.data() as DailySymptomLog);
        });

        console.log(`✅ Found ${logs.length} symptom logs for last ${days} days`);
        return logs;
    } catch (error) {
        console.error('❌ Error fetching symptom history:', error);
        throw error;
    }
};

/**
 * EXAMPLE USAGE - How to call these functions
 */

// Example 1: Save today's symptoms for IOS FISH 3
export const exampleSaveSymptoms = async () => {
    await logDailySymptom(
        'S6H3ioC6kwf66RmtB7MdiaeFdUP2',  // User ID
        '2026-01-12',                      // Today's date
        [
            { name: 'Nausea', severity: 8, notes: 'Worse after lunch, lasted 2 hours' },
            { name: 'Fatigue', severity: 6, notes: '' },
            { name: 'Pain', severity: 3, notes: 'Mild headache' }
        ],
        5  // Overall feeling
    );
};

// Example 2: Load today's symptoms
export const exampleLoadSymptoms = async () => {
    const log = await getLogForDate('S6H3ioC6kwf66RmtB7MdiaeFdUP2', '2026-01-12');
    if (log) {
        console.log('Symptoms:', log.symptomArray);
        console.log('Overall feeling:', log.overallFeeling);
    }
};

// Example 3: Get last 7 days for AI summary
export const exampleGetHistory = async () => {
    const history = await getHistory('S6H3ioC6kwf66RmtB7MdiaeFdUP2', 7);
    // Feed this to your AI agent for summarization
    return history;
};
