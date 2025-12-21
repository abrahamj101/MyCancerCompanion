import DateTimePicker from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';
import { Calendar, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Symptom {
  id: string;
  name: string;
  checked: boolean;
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
  { id: '1', name: 'Nausea', checked: false },
  { id: '2', name: 'Vomiting', checked: false },
  { id: '3', name: 'Fatigue', checked: false },
  { id: '4', name: 'Pain', checked: false },
  { id: '5', name: 'Loss of Appetite', checked: false },
];

export default function DailyLogScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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

  // Update symptoms when selected date changes
  useEffect(() => {
    const dateKey = getDateKey(selectedDate);
    const dateSymptoms = symptomsByDate[dateKey];
    
    if (dateSymptoms) {
      // Load existing symptoms for this date
      setSymptoms(dateSymptoms);
    } else {
      // Create default symptoms for new date
      const defaultSymptoms = getDefaultSymptoms();
      setSymptoms(defaultSymptoms);
      // Save to dictionary
      setSymptomsByDate((prev) => ({
        ...prev,
        [dateKey]: defaultSymptoms,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
    
    // Save to dictionary
    const dateKey = getDateKey(selectedDate);
    setSymptomsByDate((prev) => ({
      ...prev,
      [dateKey]: updatedSymptoms,
    }));
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Daily Symptom Log</Text>
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
            <View className="absolute inset-0 bg-black/50 z-50 justify-end">
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
              <TouchableOpacity
                key={symptom.id}
                onPress={() => toggleSymptom(symptom.id)}
                className={`flex-row items-center p-5 ${index !== symptoms.length - 1 ? 'border-b border-gray-200' : ''} active:bg-gray-50`}>
                <Checkbox
                  value={symptom.checked}
                  onValueChange={() => toggleSymptom(symptom.id)}
                  color={symptom.checked ? '#2563eb' : undefined}
                  className="mr-4"
                  style={{ width: 28, height: 28 }}
                />
                <Text className={`text-xl ${symptom.checked ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                  {symptom.name}
                </Text>
              </TouchableOpacity>
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