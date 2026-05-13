import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Mail, 
  Phone, 
  Languages, 
  Info, 
  ShieldCheck, 
  RotateCcw, 
  FileText, 
  Car, 
  QrCode,
  ArrowRight,
  Trash2
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';

export const SettingsScreen = ({ navigation }: any) => {
  const { user, setUser, setShowFooter, resetStore } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [name, setName] = useState(user?.displayName || 'Shah Rukh Khan');
  const [email, setEmail] = useState(user?.email || 'shahrukh@example.com');
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("9876543210");

  useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true);
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      if (name !== user?.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      setUser({ ...auth.currentUser });
      setIsEditing(null);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const basicInfo = [
    { key: 'name', label: "Name", value: name, setter: setName, hasButton: true },
    { key: 'gender', label: "Gender", value: gender, setter: setGender, hasButton: true },
    { key: 'email', label: "Email", value: email, setter: setEmail, hasButton: true },
    { key: 'phone', label: "Phone number", value: phone, setter: setPhone, hasButton: false },
  ];

  const otherItems = [
    { icon: <Languages size={22} color="#C0392B" />, label: "Change language" },
    { icon: <Info size={22} color="#C0392B" />, label: "About Us" },
    { icon: <Phone size={22} color="#C0392B" />, label: "Helplines" },
    { icon: <ShieldCheck size={22} color="#C0392B" />, label: "Privacy Policy" },
    { icon: <RotateCcw size={22} color="#C0392B" />, label: "Refund Policy" },
    { icon: <FileText size={22} color="#C0392B" />, label: "Terms of Service" },
    { icon: <Car size={22} color="#C0392B" />, label: "Last mile bookings" },
    { icon: <QrCode size={22} color="#C0392B" />, label: "Validate Pass/Ticket" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            {isEditing || (user && name !== user.displayName) ? (
              <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                {loading ? <ActivityIndicator size="small" color="#C0392B" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoBox}>
            {basicInfo.map((item, index) => (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <View style={styles.infoRight}>
                  {isEditing === item.key ? (
                    <TextInput 
                      style={styles.editInput}
                      value={item.value}
                      onChangeText={item.setter}
                      autoFocus
                      onBlur={() => setIsEditing(null)}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{item.value}</Text>
                  )}
                  {item.hasButton && (
                    <TouchableOpacity 
                      style={styles.redCircleBtn} 
                      onPress={() => setIsEditing(item.key)}
                    >
                      <ArrowRight size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Others</Text>
          <View style={styles.othersBox}>
            {otherItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.otherRow}
                onPress={() => navigation.navigate("ComingSoon")}
              >
                <View style={styles.iconBox}>
                   {item.icon}
                </View>
                <Text style={styles.otherLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerLabel}>App Version</Text>
           <Text style={styles.versionNumber}>2.0.1</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#333', fontSize: 26, fontWeight: '400', flex: 1, textAlign: 'center' },
  saveBtn: { padding: 8 },
  saveText: { color: '#C0392B', fontWeight: '700', fontSize: 16 },
  mainContent: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 15 },
  sectionTitle: { fontSize: 18, color: '#C0392B', fontWeight: '500', marginBottom: 12 },
  infoBox: { gap: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 18, color: '#333', fontWeight: '400' },
  infoRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  infoValue: { fontSize: 18, color: '#333', fontWeight: '400', marginRight: 12, textAlign: 'right' },
  editInput: { fontSize: 18, color: '#000', fontWeight: '500', marginRight: 12, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#C0392B', minWidth: 120 },
  redCircleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center' },
  othersBox: { gap: 14 },
  otherRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 30, alignItems: 'center', marginRight: 15 },
  otherLabel: { fontSize: 18, color: '#333', fontWeight: '400' },
  footer: { marginTop: 'auto', marginBottom: 20, alignItems: 'center' },
  footerLabel: { color: '#999', fontSize: 14 },
  versionNumber: { color: '#999', fontSize: 14, marginTop: 4 }
});
