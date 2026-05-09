import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { ChevronLeft, ChevronDown, Calendar } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

const PASS_TYPES = [
  { id: '1', label: 'DAILY ALL ROUTE NON AC PASS', fare: '₹40', sub: 'Daily non-ac bus pass for all routes' },
  { id: '2', label: 'DAILY ALL ROUTE AC PASS', fare: '₹50', sub: 'Daily ac bus pass for all routes' },
  { id: '3', label: 'MONTHLY GENERAL ALL ROUTE NON AC PASS', fare: '₹800', sub: 'Monthly non-ac pass for general routes' },
  { id: '4', label: 'MONTHLY AIR PORT EXPRESS AC BUS PASS', fare: '₹1400', sub: 'Monthly pass for airport express routes' },
  { id: '5', label: 'MONTHLY DELHI AND NCR AIR PORT AC BUS..', fare: '₹1800', sub: 'Monthly pass for NCR airport routes' },
  { id: '6', label: 'MONTHLY GENERAL ALL ROUTE AC PASS', fare: '₹1000', sub: 'Monthly ac pass for general routes' },
];

export const PassScreen = ({ navigation }: any) => {
  const { setShowFooter } = useAppStore();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPass, setSelectedPass] = useState(PASS_TYPES[0]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '7748900943',
    dob: '',
    idLastDigits: ''
  });

  React.useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true);
  }, []);

  const handleSelectPass = (pass: typeof PASS_TYPES[0]) => {
    setSelectedPass(pass);
    setShowPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#000" size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.staticContent}>
        {/* Pass Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pass Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pass Type</Text>
            <TouchableOpacity 
              style={styles.pickerContainer}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.pickerText} numberOfLines={1}>{selectedPass.label}</Text>
              <ChevronDown color="#666" size={20} />
            </TouchableOpacity>
            <Text style={styles.subLabel}>{selectedPass.sub}</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Pass Fare</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.fareText}>{selectedPass.fare}</Text>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Valid Till</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.validText}>23:59,</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (will be shown on pass)</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter full name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(val) => setFormData({...formData, name: val})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(val) => setFormData({...formData, phone: val})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput 
                style={[styles.textInput, { flex: 1, borderWidth: 0, paddingLeft: 0 }]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#999"
                value={formData.dob}
                onChangeText={(val) => setFormData({...formData, dob: val})}
              />
              <Calendar color="#000" size={20} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Document</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.pickerContainer, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.pickerText} placeholderTextColor="#CCC">Select ID</Text>
                <ChevronDown color="#CCC" size={18} />
              </TouchableOpacity>
              <TextInput 
                style={[styles.textInput, { flex: 1, marginLeft: 10 }]}
                placeholder="Last 4 digit"
                placeholderTextColor="#CCC"
                keyboardType="numeric"
                maxLength={4}
                value={formData.idLastDigits}
                onChangeText={(val) => setFormData({...formData, idLastDigits: val})}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Pass Type Picker Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerModal}>
            <FlatList
              data={PASS_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem}
                  onPress={() => handleSelectPass(item)}
                >
                  <Text style={styles.pickerItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextBtn}
          onPress={() => navigation.navigate('Payment', { 
            ticketData: {
              route: 'BUS PASS',
              type: selectedPass.label.includes('AC') ? 'AC' : 'Non-AC',
              total: selectedPass.fare.replace('₹', ''),
              isPass: true,
              passName: selectedPass.label
            }
          })}
        >
          <Text style={styles.nextBtnText}>Next Step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center'
  },
  staticContent: {
    paddingHorizontal: 16,
    paddingTop: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10, // Reduced from 12
    marginBottom: 8, // Reduced from 12
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8 // Reduced from 12
  },
  inputGroup: {
    marginBottom: 8 // Reduced from 12
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2 // Reduced from 4
  },
  subLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2 // Reduced from 4
  },
  pickerContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF'
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1
  },
  readonlyInput: {
    height: 52,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  fareText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32'
  },
  validText: {
    fontSize: 16,
    color: '#555'
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333'
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Lighter overlay
    justifyContent: 'flex-start', // Align to top
    paddingTop: 140, // Position it near the Pass Type input
    paddingHorizontal: 0 // Full width
  },
  pickerModal: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 0, // Squared corners like image
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    paddingVertical: 10
  },
  pickerItem: {
    paddingVertical: 18, // Increased padding
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  pickerItemText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    textTransform: 'uppercase', // Match image all-caps
    letterSpacing: 0.5
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#F8F9FA'
  },
  nextBtn: {
    backgroundColor: '#D32F2F',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  nextBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  }
});
