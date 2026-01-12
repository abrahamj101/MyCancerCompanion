
import DateTimePicker from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';
import { Calendar, Minus, Plus, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getLogForDate, logDailySymptom } from '../../services/SymptomService';
import { SymptomEntry } from '../../types';

interface Symptom {
  id: string;
  name: string;
  checked: boolean;
  severity: number;
  notes: string;
}

// Helper function to convert Date to date string key (YYYY-MM-DD)
const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default symptoms template for new dates
const getDefaultSymptoms = (): Symptom[] => [
  { id: '1', name: 'Nausea', checked: false, severity: 5, notes: '' },
  { id: '2', name: 'Vomiting', checked: false, severity: 5, notes: '' },
  { id: '3', name: 'Fatigue', checked: false, severity: 5, notes: '' },
  { id: '4', name: 'Pain', checked: false, severity: 5, notes: '' },
  { id: '5', name: 'Loss of Appetite', checked: false, severity: 5, notes: '' },
];

export default function DailyLogScreen() {
  const { actualUserId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dictionary to store symptoms by date (key: 'YYYY-MM-DD', value: Symptom[])
  const [symptomsByDate, setSymptomsByDate] = useState<Record<string, Symptom[]>>(() => {
    const todayKey = getDateKey(new Date());
    return {
      [todayKey]: getDefaultSymptoms(),
    };
  });

  // Current symptoms for the selected date
  const [symptoms, setSymptoms] = useState<Symptom[]>(getDefaultSymptoms());

  const [showAddSymptomModal, setShowAddSymptomModal] = useState(false);
  const [newSymptomName, setNewSymptomName] = useState('');

  // Debug: Check if actualUserId is available
  useEffect(() => {
    console.log('🔍 DEBUG: actualUserId =', actualUserId);
  }, [actualUserId]);

  // Load symptoms from Firebase when date changes
  useEffect(() => {
    const loadSymptomsForDate = async () => {
      if (!actualUserId) return;

      const dateKey = getDateKey(selectedDate);
      setLoading(true);

      try {
        // Try to load from Firebase
        const log = await getLogForDate(actualUserId, dateKey);

        if (log && log.symptomArray) {
          // Convert Firebase data back to UI format
          const loadedSymptoms: Symptom[] = getDefaultSymptoms().map(defaultSymptom => {
            const savedSymptom = log.symptomArray.find(s => s.name === defaultSymptom.name);
            if (savedSymptom) {
              return {
                ...defaultSymptom,
                checked: true,
                severity: savedSymptom.severity,
                notes: savedSymptom.notes || ''
              };
            }
            return defaultSymptom;
          });

          // Add any custom symptoms that were saved
          log.symptomArray.forEach(savedSymptom => {
            const exists = loadedSymptoms.find(s => s.name === savedSymptom.name);
            if (!exists) {
              loadedSymptoms.push({
                id: Date.now().toString(),
                name: savedSymptom.name,
                checked: true,
                severity: savedSymptom.severity,
                notes: savedSymptom.notes || ''
              });
            }
          });

          setSymptoms(loadedSymptoms);
          setSymptomsByDate(prev => ({ ...prev, [dateKey]: loadedSymptoms }));
        } else {
          // No data in Firebase, use defaults
          const defaultSymptoms = getDefaultSymptoms();
          setSymptoms(defaultSymptoms);
          setSymptomsByDate(prev => ({ ...prev, [dateKey]: defaultSymptoms }));
        }
      } catch (error) {
        console.error('Error loading symptoms:', error);
        const defaultSymptoms = getDefaultSymptoms();
        setSymptoms(defaultSymptoms);
      } finally {
        setLoading(false);
      }
    };

    loadSymptomsForDate();
  }, [selectedDate, actualUserId]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const toggleSymptom = (id: string) => {
    const updatedSymptoms = symptoms.map((symptom) =>
      symptom.id === id ? { ...symptom, checked: !symptom.checked } : symptom
    );
    setSymptoms(updatedSymptoms);

    const dateKey = getDateKey(selectedDate);
    setSymptomsByDate((prev) => ({
      ...prev,
      [dateKey]: updatedSymptoms,
    }));
  };

  const updateSeverity = (id: string, delta: number) => {
    const updatedSymptoms = symptoms.map((symptom) => {
      if (symptom.id === id) {
        const newSeverity = Math.min(10, Math.max(1, symptom.severity + delta));
        return { ...symptom, severity: newSeverity };
      }
      return symptom;
    });
    setSymptoms(updatedSymptoms);

    // Save to dictionary
    const dateKey = getDateKey(selectedDate);
    setSymptomsByDate((prev) => ({
      ...prev,
      [dateKey]: updatedSymptoms,
    }));
  };

  const getSeverityColorClass = (severity: number) => {
    if (severity <= 3) return 'text-green-600';
    if (severity <= 7) return 'text-orange-500';
    return 'text-red-600';
  };

  const updateNotes = (id: string, notes: string) => {
    const updatedSymptoms = symptoms.map((symptom) =>
      symptom.id === id ? { ...symptom, notes } : symptom
    );
    setSymptoms(updatedSymptoms);

    // Save to dictionary
    const dateKey = getDateKey(selectedDate);
    setSymptomsByDate((prev) => ({
      ...prev,
      [dateKey]: updatedSymptoms,
    }));
  };

  const generateSummary = () => {
    // 1. Calculate stats 
    // Total days tracked (from new prompt)
    const daysWithData = Object.keys(symptomsByDate).length;

    // Days logged this month (from old logic - optional but useful)
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysThisMonth = Object.keys(symptomsByDate).filter((dateStr) => {
      const [year, month] = dateStr.split('-').map(Number);
      return year === currentYear && (month - 1) === currentMonth;
    }).length;

    // 2. Current day details (Restored from old logic)
    const activeSymptoms = symptoms.filter((s) => s.checked);
    const symptomDetails = activeSymptoms
      .map((s) => `${s.name} (Severity ${s.severity})`)
      .join(', ');

    // 3. Construct the summary string
    let summary = `Summary for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

    // Real Stats
    summary += `• Data logged on ${daysWithData} days total(${daysThisMonth} this month).\n`;

    if (activeSymptoms.length > 0) {
      summary += `• Patient reported today: ${symptomDetails}.\n`;
    } else {
      summary += `• Patient reported no specific symptoms for this date.\n`;
    }

    // Mock AI Insights (Hardcoded placeholders)
    summary += `\nAI Insights(Mock): \n`;
    summary += `• Nausea severity peaked at 8 / 10 on Tuesday.\n`;
    summary += `• Fatigue is trending upwards.`;

    Alert.alert("Doctor's Summary", summary);
  };

  const handleAddSymptom = () => {
    setShowAddSymptomModal(true);
  };

  const handleSaveSymptom = () => {
    if (newSymptomName.trim()) {
      const newSymptom: Symptom = {
        id: Date.now().toString(),
        name: newSymptomName.trim(),
        checked: false,
        severity: 5,
        notes: '',
      };
      const updatedSymptoms = [...symptoms, newSymptom];
      setSymptoms(updatedSymptoms);

      // Save to dictionary
      const dateKey = getDateKey(selectedDate);
      setSymptomsByDate((prev) => ({
        ...prev,
        [dateKey]: updatedSymptoms,
      }));

      setNewSymptomName('');
      setShowAddSymptomModal(false);
    }
  };

  const handleCancelAddSymptom = () => {
    setNewSymptomName('');
    setShowAddSymptomModal(false);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      // Save current symptoms before switching dates
      const currentDateKey = getDateKey(selectedDate);
      setSymptomsByDate((prev) => ({
        ...prev,
        [currentDateKey]: symptoms,
      }));
      setSelectedDate(date);
    }
  };

  const handleDatePickerClose = () => {
    // Save current symptoms before closing
    const currentDateKey = getDateKey(selectedDate);
    setSymptomsByDate((prev) => ({
      ...prev,
      [currentDateKey]: symptoms,
    }));
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 bg-white">
        <View className="flex-row items-center flex-1">
          <Image
            source={require('../../MyCancerCompanion APP LOGO.png')}
            style={{ width: 40, height: 40, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-gray-900">Daily Health Log</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">


          {/* Date Header */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100 active:bg-blue-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="mr-3">
                  <Calendar size={24} color="#2563eb" />
                </View>
                <Text className="text-xl font-bold text-gray-900">
                  {formatDate(selectedDate)}
                </Text>
              </View>
              <Text className="text-base text-blue-600 font-medium">Change</Text>
            </View>
          </TouchableOpacity>

          {/* Date Picker Modal (iOS) */}
          {showDatePicker && Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={handleDatePickerClose}>
              <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={handleDatePickerClose} className="min-h-[44px] justify-center">
                      <Text className="text-lg text-blue-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Select Date</Text>
                    <TouchableOpacity onPress={handleDatePickerClose} className="min-h-[44px] justify-center">
                      <Text className="text-lg text-blue-600 font-medium">Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="bg-gray-50 rounded-lg overflow-hidden">
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(2020, 0, 1)}
                      textColor="#000000"
                      style={{ height: 200, backgroundColor: '#f9fafb' }}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Android Date Picker */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(2020, 0, 1)}
            />
          )}

          {/* Symptoms List */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Symptoms
          </Text>

          <View className="bg-white rounded-xl border border-gray-200 mb-6">
            {symptoms.map((symptom, index) => (
              <View key={symptom.id} className={`${index !== symptoms.length - 1 ? 'border-b border-gray-200' : ''} `}>
                <TouchableOpacity
                  onPress={() => toggleSymptom(symptom.id)}
                  className="flex-row items-center p-5 active:bg-gray-50">
                  <Checkbox
                    value={symptom.checked}
                    onValueChange={() => toggleSymptom(symptom.id)}
                    color={symptom.checked ? '#2563eb' : undefined}
                    className="mr-4"
                    style={{ width: 28, height: 28 }}
                  />
                  <Text className={`text - xl ${symptom.checked ? 'text-gray-900 font-semibold' : 'text-gray-700'} `}>
                    {symptom.name}
                  </Text>
                </TouchableOpacity>

                {symptom.checked && (
                  <View className="px-5 pb-5 pl-16">
                    {/* Severity Control */}
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-base font-medium text-gray-600">Severity (1-10):</Text>
                      <View className="flex-row items-center bg-gray-100 rounded-lg p-1">
                        <TouchableOpacity
                          onPress={() => updateSeverity(symptom.id, -1)}
                          className="bg-white p-2 rounded-md shadow-sm active:bg-gray-50"
                        >
                          <Minus size={20} color="#374151" />
                        </TouchableOpacity>

                        <View className="w-12 items-center">
                          <Text className={`text-xl font-bold ${getSeverityColorClass(symptom.severity)}`}>
                            {symptom.severity}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => updateSeverity(symptom.id, 1)}
                          className="bg-white p-2 rounded-md shadow-sm active:bg-gray-50"
                        >
                          <Plus size={20} color="#374151" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Notes Section */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 mb-2">Notes (optional):</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50 min-h-[44px]"
                        placeholder="Add notes about symptom here"
                        placeholderTextColor="#9ca3af"
                        value={symptom.notes}
                        onChangeText={(text) => updateNotes(symptom.id, text)}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Add Symptom Button */}
          <TouchableOpacity
            onPress={handleAddSymptom}
            className="bg-blue-600 rounded-xl p-5 flex-row items-center justify-center active:bg-blue-700 shadow-md min-h-[44px]">
            <View className="mr-2">
              <Plus size={24} color="#ffffff" />
            </View>
            <Text className="text-xl font-bold text-white">
              Add Symptom
            </Text>
          </TouchableOpacity>

          {/* Confirm Log Button */}
          <TouchableOpacity
            onPress={async () => {
              const checkedSymptoms = symptoms.filter(s => s.checked);
              if (checkedSymptoms.length === 0) {
                if (Platform.OS === 'web') {
                  alert('No Symptoms Selected\n\nPlease select at least one symptom before confirming.');
                } else {
                  Alert.alert(
                    'No Symptoms Selected',
                    'Please select at least one symptom before confirming.',
                    [{ text: 'OK' }]
                  );
                }
                return;
              }

              if (!actualUserId) {
                Alert.alert('Error', 'You must be logged in to save symptoms.');
                return;
              }

              try {
                setSaving(true);

                console.log('💾 Attempting to save symptoms...');
                console.log('  User ID:', actualUserId);
                console.log('  Date:', getDateKey(selectedDate));
                console.log('  Symptoms:', checkedSymptoms.length);

                // Convert UI symptoms to Firebase format
                const symptomArray: SymptomEntry[] = checkedSymptoms.map(s => ({
                  name: s.name,
                  severity: s.severity,
                  notes: s.notes || ''
                }));

                const dateKey = getDateKey(selectedDate);
                await logDailySymptom(actualUserId, dateKey, symptomArray);

                console.log('✅ Symptoms saved successfully!');

                const message = `Successfully logged ${checkedSymptoms.length} symptom${checkedSymptoms.length > 1 ? 's' : ''} for ${formatDate(selectedDate)}.`;
                if (Platform.OS === 'web') {
                  alert(`Symptoms Logged! ✅\n\n${message}`);
                } else {
                  Alert.alert(
                    'Symptoms Logged! ✅',
                    message,
                    [{ text: 'OK' }]
                  );
                }
              } catch (error: any) {
                console.error('❌ ERROR saving symptoms:', error);
                console.error('  Error message:', error.message);
                console.error('  Error code:', error.code);
                console.error('  Full error:', JSON.stringify(error, null, 2));

                const errorMessage = error.message || 'Failed to save symptoms. Please try again.';
                Alert.alert('Error', errorMessage);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="bg-green-600 rounded-xl p-5 mt-4 flex-row items-center justify-center active:bg-green-700 shadow-md min-h-[44px]">
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-xl font-bold text-white">
                ✓ Confirm Log
              </Text>
            )}
          </TouchableOpacity>

          {/* AI Summary Button */}
          <TouchableOpacity
            onPress={generateSummary}
            className="bg-indigo-600 rounded-xl p-5 mt-4 flex-row items-center justify-center shadow-lg shadow-indigo-200 active:bg-indigo-700 min-h-[44px]">
            <View className="mr-2">
              <Sparkles size={24} color="#ffffff" />
            </View>
            <Text className="text-xl font-bold text-white">
              ✨ Summarize for Doctor
            </Text>
          </TouchableOpacity>

          {/* Add Symptom Modal */}
          <Modal
            visible={showAddSymptomModal}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelAddSymptom}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1">
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleCancelAddSymptom}
                className="flex-1 bg-black/50 justify-end">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-3xl p-6">
                  <Text className="text-2xl font-bold text-gray-900 mb-4">
                    Add New Symptom
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                    placeholder="Enter symptom name"
                    placeholderTextColor="#9ca3af"
                    value={newSymptomName}
                    onChangeText={setNewSymptomName}
                    autoFocus={true}
                    onSubmitEditing={handleSaveSymptom}
                  />
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      onPress={handleCancelAddSymptom}
                      className="px-6 py-3 rounded-lg min-h-[44px] justify-center mr-3">
                      <Text className="text-lg font-medium text-gray-700">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveSymptom}
                      className="px-6 py-3 bg-blue-600 rounded-lg min-h-[44px] justify-center active:bg-blue-700">
                      <Text className="text-lg font-semibold text-white">Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}