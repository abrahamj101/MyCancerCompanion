import { storage } from './storage';

/**
 * Diagnostic utility to test AsyncStorage persistence
 * Call this from your app to verify AsyncStorage is working
 */
export const testAsyncStorage = async () => {
    console.log('\n🧪 ═══════════════════════════════════════════════════');
    console.log('🧪 ASYNCSTORAGE DIAGNOSTIC TEST');
    console.log('🧪 ═══════════════════════════════════════════════════');

    try {
        const testKey = 'test_persistence_key';
        const testValue = `test_${Date.now()}`;

        // Test 1: Write
        console.log('\n📝 TEST 1: Writing to AsyncStorage...');
        console.log('   → Key:', testKey);
        console.log('   → Value:', testValue);
        await storage.setItem(testKey, testValue);
        console.log('   ✅ Write complete');

        // Test 2: Read immediately
        console.log('\n📖 TEST 2: Reading immediately after write...');
        const readValue = await storage.getItem(testKey);
        console.log('   → Read value:', readValue);
        console.log('   → Match?', readValue === testValue ? '✅ YES' : '❌ NO');

        // Test 3: Check onboarding UID
        console.log('\n📖 TEST 3: Checking onboarding UID...');
        const onboardingUID = await storage.getItem('onboardingCompletedForUID');
        console.log('   → Stored UID:', onboardingUID || 'NULL');

        // Test 4: Cleanup
        console.log('\n🧹 TEST 4: Cleaning up test data...');
        await storage.removeItem(testKey);
        const verifyDelete = await storage.getItem(testKey);
        console.log('   → Deleted?', verifyDelete === null ? '✅ YES' : '❌ NO');

        console.log('\n🧪 ═══════════════════════════════════════════════════');
        console.log('🧪 DIAGNOSTIC TEST COMPLETE');
        console.log('🧪 ═══════════════════════════════════════════════════\n');

        return {
            writeSuccess: true,
            readSuccess: readValue === testValue,
            onboardingUID: onboardingUID,
        };
    } catch (error) {
        console.error('\n❌ AsyncStorage test failed:', error);
        console.log('🧪 ═══════════════════════════════════════════════════\n');
        return {
            writeSuccess: false,
            readSuccess: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
