import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Platform, Modal, ActivityIndicator } from 'react-native';
import { RemixIcon } from '../../components/RemixIcon';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../core/theme';
import { useAppStore } from '../../store/useAppStore';
import { generateTicketId, getRouteNumberOnly } from '../../utils/ticketHelper';
import { db, auth } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PaytmIcon, PhonePeIcon, GPayIcon, AmazonPayIcon } from '../../components/PaymentIcons';

export const PaymentScreen = ({ navigation, route }: any) => {
  const { ticketData = {} } = route.params || {};
  const { addTicket } = useAppStore();
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')} ${now.toLocaleString('en-GB', { month: 'short' })}, ${now.getFullYear()}`;
  const summaryTime = dateStr + ' | ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const [timeLeft, setTimeLeft] = useState(138);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const startSimulation = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(handleFinalize, 1500);
    }, 2000);
  };

  const handleFinalize = async () => {
    try {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')} ${now.toLocaleString('en-GB', { month: 'short' })}, ${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const tid = generateTicketId();
      
      const finalTicket = {
        ...ticketData,
        baseFare: ticketData.baseFare || 10,
        date: dateStr,
        time: timeStr,
        timestamp: now.getTime(),
        userId: auth.currentUser?.uid,
        status: 'active',
        tid: tid
      };

      await addDoc(collection(db, "tickets"), finalTicket);
      addTicket({ 
        ...finalTicket, 
        fare: ticketData.total, 
        status: 'active' as any,
        tid: tid
      });
      setPaymentStatus('idle');
      navigation.replace('Ticket');
    } catch (error) {
      console.error(error);
      setPaymentStatus('idle');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Complete Payment</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryDateText}>{summaryTime}</Text>
          </View>
          <View style={styles.summaryBody}>
            <View style={styles.summaryTopRow}>
              <View style={styles.busInfo}>
                <MaterialCommunityIcons name="bus" size={24} color="#000" />
                <Text style={styles.busRouteText}>{getRouteNumberOnly(ticketData.route)}</Text>
              </View>
              <Text style={styles.fareCalcText}>
                ₹{Number(ticketData.baseFare).toFixed(1)} x {ticketData.qty} = <Text style={styles.fareGreen}>₹{ticketData.total}</Text>
              </Text>
            </View>
            
            <View style={styles.pathRow}>
              <View style={styles.stopWrapper}>
                <Text style={styles.stopText} numberOfLines={2}>{ticketData.source}</Text>
              </View>
              <View style={styles.arrowWrapper}>
                <MaterialCommunityIcons name="arrow-right" size={24} color="#333" />
              </View>
              <View style={styles.stopWrapper}>
                <Text style={styles.stopText} numberOfLines={2}>{ticketData.dest}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPI</Text>
        </View>

        <View style={styles.upiGrid}>
          <TouchableOpacity style={styles.upiCard} onPress={startSimulation}>
            <PaytmIcon size={42} />
            <Text style={styles.upiLabel}>Paytm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={startSimulation}>
            <PhonePeIcon size={42} />
            <Text style={styles.upiLabel}>PhonePe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={startSimulation}>
            <GPayIcon size={42} />
            <Text style={styles.upiLabel}>GPay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.upiCard} onPress={startSimulation}>
            <AmazonPayIcon size={42} />
            <Text style={styles.upiLabel}>Amazon..</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Others</Text>
        </View>

        <TouchableOpacity style={styles.othersRow} onPress={startSimulation}>
          <View style={styles.othersLeft}>
            <MaterialCommunityIcons name="credit-card" size={28} color="#D32F2F" />
            <Text style={styles.othersText}>Wallet, Cards or Net banking</Text>
          </View>
          <MaterialIcons name="chevron-right" size={26} color="#666" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.timerPill} onPress={startSimulation}>
          <Text style={styles.timerText}>
            Pay within <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={paymentStatus !== 'idle'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.simulationBox}>
            {paymentStatus === 'processing' ? (
              <>
                <ActivityIndicator size="large" color="#D32F2F" />
                <Text style={styles.modalHeading}>Verifying payment...</Text>
                <Text style={styles.modalSub}>Please don't close the app</Text>
              </>
            ) : (
              <>
                <View style={styles.successIconBg}>
                  <MaterialIcons name="check" size={50} color="white" />
                </View>
                <Text style={styles.successHeading}>Success!</Text>
                <Text style={styles.modalSub}>Ticket generated successfully</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    backgroundColor: '#D32F2F', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 5
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 56,
    position: 'relative'
  },
  backBtn: { padding: 4, zIndex: 10 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '600', marginLeft: 20 },
  scrollContainer: { flex: 1 },
  
  summaryCard: { margin: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', backgroundColor: 'white' },
  summaryHeader: { backgroundColor: '#808080', paddingVertical: 10, paddingHorizontal: 15 },
  summaryDateText: { color: 'white', fontSize: 14, fontWeight: '500' },
  summaryBody: { padding: 16 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  busInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busRouteText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  fareCalcText: { fontSize: 15, color: '#333' },
  fareGreen: { color: '#4CAF50', fontWeight: 'bold' },
  
  pathRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stopWrapper: { flex: 1 },
  arrowWrapper: { paddingHorizontal: 10 },
  stopText: { fontSize: 14, color: '#333', fontWeight: '400', textAlign: 'center' },
  
  sectionHeader: { backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  upiGrid: { flexDirection: 'row', padding: 12, justifyContent: 'space-between' },
  upiCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    padding: 12, 
    alignItems: 'center', 
    width: '23%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  upiLabel: { marginTop: 8, fontSize: 12, color: '#4B5563', fontWeight: '500' },
  
  othersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white' },
  othersLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  othersText: { fontSize: 15, color: '#1F2937' },
  
  footerContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
  timerPill: { 
    backgroundColor: '#D32F2F', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  timerText: { color: 'white', fontSize: 14 },
  timerBold: { fontWeight: 'bold' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  simulationBox: { backgroundColor: 'white', padding: 40, borderRadius: 24, alignItems: 'center', width: '85%' },
  modalHeading: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#1F2937' },
  modalSub: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  successIconBg: { backgroundColor: '#4CAF50', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  successHeading: { fontSize: 22, fontWeight: 'bold', marginTop: 20, color: '#4CAF50' }
});
