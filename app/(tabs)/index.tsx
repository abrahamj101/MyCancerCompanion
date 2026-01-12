import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Edit, MapPin, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '../../utils/storage';

interface AppointmentDetails {
  doctor?: string;
  room?: string;
  floor?: string;
  notes?: string;
  duration?: string;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  address?: string;
  details?: AppointmentDetails;
  dateTime?: Date; // Store actual Date object for editing
}

// Helper function to open maps
const openMap = (locationName: string, address: string) => {
  const query = encodeURIComponent(address);
  const url = Platform.select({
    ios: `maps:0,0?q=${query}`,
    android: `geo:0,0?q=${query}`,
  });

  if (url) {
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  }
};

// Helper function to format date for display
const formatDateDisplay = (date: Date): string => {
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
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
};

// Helper function to format time for display
const formatTimeDisplay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Initial dummy appointment data
const getInitialAppointments = (): Appointment[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  // Dynamic date variables
  const oneWeekFromToday = new Date();
  oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
  oneWeekFromToday.setHours(10, 0, 0, 0);

  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  oneMonthFromNow.setHours(9, 0, 0, 0);

  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  threeMonthsFromNow.setHours(14, 0, 0, 0);

  return [
    {
      id: '0',
      title: 'MRI Scan',
      date: formatDateDisplay(tomorrow),
      time: formatTimeDisplay(tomorrow),
      location: 'Houston Methodist Sugar Land Hospital',
      address: '16655 Southwest Fwy, Sugar Land, TX 77479',
      type: 'MRI',
      dateTime: tomorrow,
      details: {
        doctor: 'Dr. Sarah Mitchell',
        room: 'Room 204',
        floor: 'Floor 2',
        duration: '45 minutes',
        notes: 'Please arrive 15 minutes early. No food or drink 4 hours before.',
      },
    },
    {
      id: '1',
      title: 'Oncology Consultation',
      date: formatDateDisplay(oneWeekFromToday),
      time: formatTimeDisplay(oneWeekFromToday),
      location: 'Houston Methodist Outpatient Center',
      address: '6445 Main St, Houston, TX 77030',
      type: 'Checkup',
      dateTime: oneWeekFromToday,
      details: {
        doctor: 'Dr. James Smith',
        room: 'Room 304',
        floor: 'Floor 3',
        duration: '1 hour',
        notes: 'Bring your latest test results and medication list.',
      },
    },
    {
      id: '2',
      title: 'Chemotherapy Session',
      date: formatDateDisplay(oneMonthFromNow),
      time: formatTimeDisplay(oneMonthFromNow),
      location: 'MD Anderson Cancer Center',
      address: '1515 Holcombe Blvd, Houston, TX 77030',
      type: 'Chemo',
      dateTime: oneMonthFromNow,
      details: {
        doctor: 'Dr. Emily Rodriguez',
        room: 'Room 105',
        floor: 'Floor 1',
        duration: '3 hours',
        notes: 'Bring a book or device for entertainment. Snacks provided.',
      },
    },
    {
      id: '3',
      title: 'Follow-up Blood Work',
      date: formatDateDisplay(oneMonthFromNow),
      time: formatTimeDisplay(oneMonthFromNow),
      location: 'Houston Methodist Sugar Land',
      address: '16655 Southwest Fwy, Sugar Land, TX 77479',
      type: 'Checkup',
      dateTime: oneMonthFromNow,
      details: {
        doctor: 'Lab Technician',
        room: 'Room 12',
        floor: 'Ground Floor',
        duration: '15 minutes',
        notes: 'Fasting required. No food or drink after midnight.',
      },
    },
    {
      id: '4',
      title: 'Oncologist Consult',
      date: formatDateDisplay(threeMonthsFromNow),
      time: formatTimeDisplay(threeMonthsFromNow),
      location: 'Houston Methodist Willowbrook',
      address: '18220 State Hwy 249, Houston, TX 77070',
      type: 'Checkup',
      dateTime: threeMonthsFromNow,
      details: {
        doctor: 'Dr. James Smith',
        room: 'Room 401',
        floor: 'Floor 4',
        duration: '45 minutes',
        notes: 'Review treatment progress and discuss next steps. Bring all recent test results.',
      },
    },
    {
      id: '5',
      title: 'Chemotherapy Cycle 2',
      date: formatDateDisplay(threeMonthsFromNow),
      time: formatTimeDisplay(threeMonthsFromNow),
      location: 'MD Anderson Cancer Center',
      address: '1515 Holcombe Blvd, Houston, TX 77030',
      type: 'Chemo',
      dateTime: threeMonthsFromNow,
      details: {
        doctor: 'Dr. Emily Rodriguez',
        room: 'Room 105',
        floor: 'Floor 1',
        duration: '4 hours',
        notes: 'Second cycle of treatment. Bring comfortable clothing and entertainment. Light snacks provided.',
      },
    },
    {
      id: '6',
      title: 'Nutritionist Follow-up',
      date: formatDateDisplay(threeMonthsFromNow),
      time: formatTimeDisplay(threeMonthsFromNow),
      location: 'Nutrition & Wellness Center',
      address: '13300 Hargrave Rd, Houston, TX 77070',
      type: 'Checkup',
      dateTime: threeMonthsFromNow,
      details: {
        doctor: 'Dr. Maria Garcia',
        room: 'Room 205',
        floor: 'Floor 2',
        duration: '30 minutes',
        notes: 'Review dietary plan and discuss meal options during treatment.',
      },
    },
  ];
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(getInitialAppointments());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Form state for add/edit appointment
  const [formTitle, setFormTitle] = useState('');
  const [formDoctor, setFormDoctor] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState('MRI');
  const [formNotes, setFormNotes] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formDateTime, setFormDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reset tap count after 2 seconds
  useEffect(() => {
    if (logoTapCount > 0) {
      const resetTimer = setTimeout(() => setLogoTapCount(0), 2000);
      return () => clearTimeout(resetTimer);
    }
  }, [logoTapCount]);

  const handleLogoPress = async () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);

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
      setLogoTapCount(0);
    }
  };

  // Get upcoming appointment (next appointment)
  const getUpcomingAppointment = (): Appointment | null => {
    const now = new Date();
    const upcoming = appointments
      .filter((apt) => apt.dateTime && apt.dateTime > now)
      .sort((a, b) => (a.dateTime?.getTime() || 0) - (b.dateTime?.getTime() || 0));
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  // Get future appointments (excluding the upcoming one)
  const getFutureAppointments = (): Appointment[] => {
    const upcoming = getUpcomingAppointment();
    const now = new Date();
    return appointments
      .filter((apt) => apt.id !== upcoming?.id && apt.dateTime && apt.dateTime > now)
      .sort((a, b) => (a.dateTime?.getTime() || 0) - (b.dateTime?.getTime() || 0));
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedAppointment(null);
  };

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setFormTitle('');
    setFormDoctor('');
    setFormLocation('');
    setFormType('MRI');
    setFormNotes('');
    setFormRoom('');
    setFormFloor('');
    setFormDuration('');
    setFormDateTime(new Date());
    setShowEditModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormTitle(appointment.title);
    setFormDoctor(appointment.details?.doctor || '');
    setFormLocation(appointment.location);
    setFormType(appointment.type);
    setFormNotes(appointment.details?.notes || '');
    setFormRoom(appointment.details?.room || '');
    setFormFloor(appointment.details?.floor || '');
    setFormDuration(appointment.details?.duration || '');
    setFormDateTime(appointment.dateTime || new Date());
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleSaveAppointment = () => {
    // 1. Empty Fields Check
    if (!formTitle.trim() || !formLocation.trim() || !formType.trim() || !formDoctor.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields (Title, Location, Type, Doctor Name).');
      return;
    }

    // 2. Past Date Check
    if (formDateTime < new Date()) {
      Alert.alert('Invalid Date', 'Upcoming appointments must be in the future.');
      return;
    }

    // 3. Address Check
    if (!formLocation.includes(',')) {
      Alert.alert(
        'Check Address',
        "Please include the City and State (e.g., 'Houston, TX') so the map link works correctly."
      );
      return;
    }

    const newAppointment: Appointment = {
      id: editingAppointment?.id || Date.now().toString(),
      title: formTitle.trim(),
      date: formatDateDisplay(formDateTime),
      time: formatTimeDisplay(formDateTime),
      location: formLocation.trim(),
      // Use formLocation as address if it's newor updated, assuming it passed validation
      address: editingAppointment?.address || formLocation.trim(),
      type: formType,
      dateTime: formDateTime,
      details: {
        doctor: formDoctor.trim() || undefined,
        room: formRoom.trim() || undefined,
        floor: formFloor.trim() || undefined,
        duration: formDuration.trim() || undefined,
        notes: formNotes.trim() || undefined,
      },
    };

    if (editingAppointment) {
      // Update existing
      setAppointments(appointments.map((apt) => (apt.id === editingAppointment.id ? newAppointment : apt)));
    } else {
      // Add new
      setAppointments([...appointments, newAppointment]);
    }

    Alert.alert('Success', 'Appointment added!');
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    Alert.alert(
      'Delete Appointment?',
      'Are you sure you want to remove this appointment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
            setShowEditModal(false);
            setEditingAppointment(null);
            setShowDetailsModal(false);
            setSelectedAppointment(null);
            Alert.alert('Success', 'The appointment has been removed.');
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (event?.type === 'dismissed') {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      return;
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setFormDateTime((prev) => {
        const updated = new Date(date);
        updated.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return updated;
      });
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (event?.type === 'dismissed') {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
      return;
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setFormDateTime((prev) => {
        const updated = new Date(prev);
        updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
        return updated;
      });
    }
  };

  const upcomingAppointment = getUpcomingAppointment();
  const futureAppointments = getFutureAppointments();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      {/* Header with Logo and Add button */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.7}>
            <Image
              source={require('../../MyCancerCompanion APP LOGO.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Your Care Plan</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddAppointment}
          className="bg-blue-600 dark:bg-blue-500 rounded-full p-3 min-h-[44px] min-w-[44px] justify-center items-center active:bg-blue-700 dark:active:bg-blue-600">
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          {/* Hero Card - Next Upcoming Appointment */}
          {upcomingAppointment ? (
            <TouchableOpacity
              onPress={() => handleAppointmentPress(upcomingAppointment)}
              className="bg-blue-100 rounded-xl p-6 mb-6 shadow-sm border border-blue-200 active:bg-blue-200 min-h-[44px]">
              <Text className="text-sm font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                Next Upcoming Appointment
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mb-3">
                {upcomingAppointment.title}
              </Text>
              <View className="flex-row items-center mb-2">
                <View className="mr-2">
                  <Calendar size={20} color="#1e40af" />
                </View>
                <Text className="text-lg text-gray-700 font-medium">
                  {upcomingAppointment.date}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <View className="mr-2">
                  <Clock size={20} color="#1e40af" />
                </View>
                <Text className="text-lg text-gray-700 font-medium">
                  {upcomingAppointment.time}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openMap(upcomingAppointment.location, upcomingAppointment.address || upcomingAppointment.location)}
                className="flex-row items-start mt-3">
                <View className="mr-2 mt-0.5">
                  <MapPin size={20} color="#1e40af" />
                </View>
                <Text className="text-lg text-blue-800 underline flex-1">
                  {upcomingAppointment.location}
                </Text>
              </TouchableOpacity>
              <View className="mt-4 pt-4 border-t border-blue-200">
                <Text className="text-base text-blue-700 font-medium">
                  Type: {upcomingAppointment.type}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <Text className="text-lg text-gray-600 text-center">
                No upcoming appointments. Tap the + button to add one.
              </Text>
            </View>
          )}

          {/* Future Appointments List */}
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Upcoming Appointments
          </Text>

          {futureAppointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              onPress={() => handleAppointmentPress(appointment)}
              className="bg-white rounded-lg p-5 mb-4 shadow-sm border border-gray-200 active:bg-gray-50 min-h-[44px]">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-xl font-bold text-gray-900 flex-1">
                  {appointment.title}
                </Text>
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-gray-700">
                    {appointment.type}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mb-2">
                <View className="mr-2">
                  <Calendar size={18} color="#6b7280" />
                </View>
                <Text className="text-lg text-gray-700">
                  {appointment.date}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <View className="mr-2">
                  <Clock size={18} color="#6b7280" />
                </View>
                <Text className="text-lg text-gray-700">
                  {appointment.time}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openMap(appointment.location, appointment.address || appointment.location)}
                className="flex-row items-start mt-2">
                <View className="mr-2 mt-0.5">
                  <MapPin size={18} color="#6b7280" />
                </View>
                <Text className="text-lg text-blue-600 underline flex-1">
                  {appointment.location}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* Appointment Details Modal */}
          <Modal
            visible={showDetailsModal}
            transparent={true}
            animationType="slide"
            onRequestClose={closeModal}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold text-gray-900">
                    Appointment Details
                  </Text>
                  <TouchableOpacity
                    onPress={closeModal}
                    className="px-4 py-2 min-h-[44px] justify-center">
                    <Text className="text-lg font-medium text-blue-600">Close</Text>
                  </TouchableOpacity>
                </View>

                {selectedAppointment && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedAppointment.title}
                    </Text>

                    <View className="mb-4">
                      <View className="flex-row items-center mb-2">
                        <Calendar size={20} color="#6b7280" />
                        <Text className="text-lg text-gray-700 ml-2">
                          {selectedAppointment.date}
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <Clock size={20} color="#6b7280" />
                        <Text className="text-lg text-gray-700 ml-2">
                          {selectedAppointment.time}
                        </Text>
                      </View>
                      <View className="flex-row items-start mb-2">
                        <MapPin size={20} color="#6b7280" />
                        {selectedAppointment.address ? (
                          <TouchableOpacity
                            onPress={() => openMap(selectedAppointment.location, selectedAppointment.address!)}
                            className="ml-2 flex-1 flex-row items-center flex-wrap">
                            <Text className="text-lg text-blue-600 underline">
                              {selectedAppointment.location}
                            </Text>
                            <MapPin size={16} color="#2563eb" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        ) : (
                          <Text className="text-lg text-gray-700 ml-2 flex-1">
                            {selectedAppointment.location}
                          </Text>
                        )}
                      </View>
                    </View>

                    {selectedAppointment.details && (
                      <View className="bg-gray-50 rounded-lg p-4 mb-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                          Additional Information
                        </Text>
                        {selectedAppointment.details.doctor && (
                          <Text className="text-lg text-gray-700 mb-2">
                            <Text className="font-semibold">Doctor:</Text> {selectedAppointment.details.doctor}
                          </Text>
                        )}
                        {selectedAppointment.details.floor && selectedAppointment.details.room && (
                          <Text className="text-lg text-gray-700 mb-2">
                            <Text className="font-semibold">Location:</Text> {selectedAppointment.details.floor}, {selectedAppointment.details.room}
                          </Text>
                        )}
                        {selectedAppointment.details.duration && (
                          <Text className="text-lg text-gray-700 mb-2">
                            <Text className="font-semibold">Duration:</Text> {selectedAppointment.details.duration}
                          </Text>
                        )}
                        {selectedAppointment.details.notes && (
                          <View className="mt-3 pt-3 border-t border-gray-300">
                            <Text className="text-lg font-semibold text-gray-900 mb-1">
                              Notes:
                            </Text>
                            <Text className="text-lg text-gray-700">
                              {selectedAppointment.details.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View className="mt-4 pt-4 border-t border-gray-200 flex-row justify-between items-center">
                      <View className="bg-blue-100 px-3 py-2 rounded-full">
                        <Text className="text-base font-semibold text-blue-800">
                          Type: {selectedAppointment.type}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleEditAppointment(selectedAppointment)}
                        className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center min-h-[44px] active:bg-blue-700">
                        <Edit size={18} color="#ffffff" />
                        <Text className="text-base font-semibold text-white ml-2">Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Add/Edit Appointment Modal */}
          <Modal
            visible={showEditModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowEditModal(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1">
              <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900">
                      {editingAppointment ? 'Edit Appointment' : 'Add Appointment'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowEditModal(false)}
                      className="px-4 py-2 min-h-[44px] justify-center">
                      <Text className="text-lg font-medium text-blue-600">Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-base font-semibold text-gray-700 mb-2">Title *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                      placeholder="e.g., MRI Scan"
                      value={formTitle}
                      onChangeText={setFormTitle}
                    />

                    <Text className="text-base font-semibold text-gray-700 mb-2">Type *</Text>
                    <View className="flex-row flex-wrap mb-4">
                      {['MRI', 'Chemo', 'Checkup'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setFormType(type)}
                          className={`px-4 py-2 rounded-lg mr-2 mb-2 min-h-[44px] justify-center ${formType === type ? 'bg-blue-600' : 'bg-gray-200'
                            }`}>
                          <Text
                            className={`text-base font-medium ${formType === type ? 'text-white' : 'text-gray-700'
                              }`}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text className="text-base font-semibold text-gray-700 mb-2">Date & Time *</Text>
                    <View className="flex-row mb-4">
                      <TouchableOpacity
                        onPress={() => {
                          setShowTimePicker(false);
                          setShowDatePicker(!showDatePicker);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg p-4 mr-2 min-h-[44px] justify-center">
                        <Text className="text-lg text-gray-900">
                          {formDateTime.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setShowTimePicker(!showTimePicker);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg p-4 min-h-[44px] justify-center">
                        <Text className="text-lg text-gray-900">
                          {formatTimeDisplay(formDateTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showDatePicker && Platform.OS === 'ios' && (
                      <View className="mb-4 bg-gray-50 rounded-lg p-2">
                        <DateTimePicker
                          value={formDateTime}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                          textColor="#000000"
                          style={{ height: 200 }}
                        />
                      </View>
                    )}

                    {showTimePicker && Platform.OS === 'ios' && (
                      <View className="mb-4 bg-gray-50 rounded-lg p-2">
                        <DateTimePicker
                          value={formDateTime}
                          mode="time"
                          display="spinner"
                          onChange={handleTimeChange}
                          textColor="#000000"
                          style={{ height: 200 }}
                        />
                      </View>
                    )}

                    {showDatePicker && Platform.OS === 'android' && (
                      <DateTimePicker
                        value={formDateTime}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    )}

                    {showTimePicker && Platform.OS === 'android' && (
                      <DateTimePicker
                        value={formDateTime}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                      />
                    )}

                    <Text className="text-base font-semibold text-gray-700 mb-2">Location *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                      placeholder="e.g., City Medical Center"
                      value={formLocation}
                      onChangeText={setFormLocation}
                    />

                    <Text className="text-base font-semibold text-gray-700 mb-2">Doctor Name</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                      placeholder="e.g., Dr. Smith"
                      value={formDoctor}
                      onChangeText={setFormDoctor}
                    />

                    <View className="flex-row mb-4">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-semibold text-gray-700 mb-2">Floor</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg p-4 text-lg min-h-[44px] bg-white"
                          placeholder="e.g., Floor 3"
                          value={formFloor}
                          onChangeText={setFormFloor}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-700 mb-2">Room</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg p-4 text-lg min-h-[44px] bg-white"
                          placeholder="e.g., Room 304"
                          value={formRoom}
                          onChangeText={setFormRoom}
                        />
                      </View>
                    </View>

                    <Text className="text-base font-semibold text-gray-700 mb-2">Duration</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[44px] bg-white"
                      placeholder="e.g., 1 hour"
                      value={formDuration}
                      onChangeText={setFormDuration}
                    />

                    <Text className="text-base font-semibold text-gray-700 mb-2">Notes</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-4 text-lg mb-4 min-h-[100px] bg-white"
                      placeholder="Additional notes..."
                      value={formNotes}
                      onChangeText={setFormNotes}
                      multiline={true}
                      textAlignVertical="top"
                    />

                    {editingAppointment && (
                      <TouchableOpacity
                        onPress={() => handleDeleteAppointment(editingAppointment.id)}
                        className="bg-red-600 rounded-lg py-3 px-4 mb-4 min-h-[44px] justify-center active:bg-red-700">
                        <Text className="text-lg font-semibold text-white text-center">Delete Appointment</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={handleSaveAppointment}
                      className="bg-blue-600 rounded-lg py-3 px-4 min-h-[44px] justify-center active:bg-blue-700">
                      <Text className="text-lg font-semibold text-white text-center">
                        {editingAppointment ? 'Save Changes' : 'Add Appointment'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}