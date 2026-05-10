import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Platform, StatusBar, Image } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getLatestActiveTicket, getRouteNumberOnly, formatTimeTo12hr } from '../../utils/ticketHelper';
import QRCode from 'react-native-qrcode-svg';
import { useKeepAwake } from 'expo-keep-awake';

const logoImg = require('../../../assets/images/logo.webp');

export const TicketScreen = ({ navigation }: any) => {
  useKeepAwake(); // Keeps screen on during ticket inspection
  const { tickets, setShowFooter } = useAppStore();
  const activeTicket = getLatestActiveTicket(tickets);
  
  const [showQR, setShowQR] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setShowFooter(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => setShowFooter(true);
  }, []);

  if (!activeTicket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No active ticket found</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const routeCode = getRouteNumberOnly(activeTicket.route);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* PIXEL-PERFECT HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main')} 
            style={styles.iconWrapper}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('History')} 
            style={styles.allTicketsBtn} 
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={28} color="white" />
            <Text style={styles.allTicketsText}>All tickets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
            
            {/* Elite Ticket Card Reconstruction */}
            {/* Elite Ticket / QR View Toggle */}
            {!showQR ? (
              <View style={styles.ticketCard}>
                <Text style={styles.deptTitle}>Transport Dept. of Delhi</Text>
                
                <View style={styles.validationSummary}>
                  <Text style={styles.validatedLabel}>VALIDATED</Text>
                  <Text style={styles.validatedValue}>₹{(activeTicket.qty * (activeTicket.baseFare || 10)).toFixed(1)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.dataRow}>
                  <View style={styles.dataCol}>
                    <Text style={styles.label}>Bus Route</Text>
                    <Text style={styles.largeValue}>{routeCode}</Text>
                  </View>
                  <View style={[styles.dataCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.label}>Fare</Text>
                    <Text style={[styles.largeValue, { fontWeight: '700' }]}>₹{Number(activeTicket.total).toFixed(1)}</Text>
                  </View>
                </View>

                <View style={[styles.dataRow, { marginTop: 12 }]}>
                  <View style={{ flex: 2.5 }}>
                    <Text style={styles.label}>Booking Time</Text>
                    <Text style={styles.mediumValue}>{activeTicket.date} | {formatTimeTo12hr(activeTicket.time)}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.label}>Bus Tickets</Text>
                    <Text style={styles.mediumValue}>{activeTicket.qty}</Text>
                  </View>
                </View>

                <View style={styles.stopBox}>
                  <Text style={styles.label}>Starting stop</Text>
                  <Text style={styles.stopText}>{activeTicket.source || activeTicket.src || 'Starting Point'}</Text>
                </View>

                <View style={[styles.stopBox, { marginTop: 12 }]}>
                  <Text style={styles.label}>Ending stop</Text>
                  <Text style={styles.stopText}>{activeTicket.dest || activeTicket.dst || 'Destination'}</Text>
                </View>

                <Text style={styles.tidLabel}>{activeTicket.tid || activeTicket.id || 'T0000000000'}</Text>

                <TouchableOpacity 
                  style={styles.qrButton} 
                  onPress={() => setShowQR(true)}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons name="qrcode" size={24} color="white" />
                  <Text style={styles.qrButtonText}>Show QR code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => setShowQR(false)} 
                style={styles.qrCardMain}
              >
                <QRCode 
                  value={`TRANSPORT_DEPT_OF_DELHI|ID:${activeTicket.tid || activeTicket.id}|ROUTE:${activeTicket.route}|FROM:${activeTicket.source || activeTicket.src}|TO:${activeTicket.dest || activeTicket.dst}|TIME:${activeTicket.time}|QTY:${activeTicket.qty}|FARE:${activeTicket.total}|STATUS:VALIDATED|AUTH:ONDC_NETWORK|SECURE_HASH:${(activeTicket.tid || activeTicket.id || '').slice(-8)}`} 
                  size={280} 
                  color="black" 
                  backgroundColor="white" 
                  ecl="M"
                />
              </TouchableOpacity>
            )}

            {/* Validation Status Pill */}
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                Validated At: {activeTicket.date} | {formatTimeTo12hr(activeTicket.time)}
              </Text>
            </View>

          </Animated.View>
        </View>

        {/* Sticky Branding Footer */}
        <View style={styles.footer}>
          <Image source={logoImg} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.poweredText}>Powered by IIIT-Delhi</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D32F2F' },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 60,
    marginTop: Platform.OS === 'ios' ? 30 : 35, // Further shifted down
    zIndex: 10
  },
  iconWrapper: { padding: 4 },
  allTicketsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  allTicketsText: { color: 'white', fontSize: 16, fontWeight: '500' },
  mainContent: { paddingHorizontal: 20, flex: 1 },
  mainWrapper: { alignItems: 'center', marginTop: 150 },
  
  ticketCard: { 
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    borderRadius: 5, 
    padding: 15, // Tightened
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12
  },

  qrCardMain: {
    backgroundColor: '#FFFFFF',
    marginTop: 50,
    width: 320,
    height: 320,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15
  },
  deptTitle: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#000', 
    textAlign: 'center', 
    marginBottom: 12,
    letterSpacing: 0.2
  },
  validationSummary: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10 
  },
  validatedLabel: { color: '#000000cb', fontSize: 18, fontWeight: '500', letterSpacing: 0.5 },
  validatedValue: { color: '#000', fontSize: 18, fontWeight: '400' },
  
  divider: { height: 1, backgroundColor: '#000000', marginBottom: 12 },
  
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataCol: { flex: 1 },
  label: { color: '#3e3e3eff', fontSize: 13, fontWeight: '400', marginBottom: 2 },
  largeValue: { color: '#000', fontSize: 18, fontWeight: '400' },
  mediumValue: { color: '#000', fontSize: 16, fontWeight: '400' },
  
  stopBox: { marginTop: 12 },
  stopText: { color: '#000', fontSize: 17, fontWeight: '400', lineHeight: 20 },
  
  tidLabel: { 
    color: '#888', 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 10, 
    marginBottom: 10,
    letterSpacing: 0.5
  },
  
  qrButton: { 
    backgroundColor: '#D32F2F', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    gap: 10
  },
  qrButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  qrArea: { alignItems: 'center', paddingVertical: 10 },
  hideQR: { marginTop: 15 },
  hideQRText: { color: '#A00E0E', fontWeight: 'bold', fontSize: 15 },

  statusPill: { 
    backgroundColor: '#FFFFFF', 
    marginTop: 30, // Increased for image alignment
    paddingHorizontal: 20, 
    paddingVertical: 9, 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  statusPillText: { color: '#D32F2F', fontSize: 15, fontWeight: '500' },

  footer: { 
    position: 'absolute', 
    bottom: 8, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    gap: 2
  },
  logoImg: { width: 100, height: 32 },
  poweredText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '400' },

  errorContainer: { flex: 1, backgroundColor: '#A00E0E', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  errorBackBtn: { backgroundColor: 'white', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  errorBackBtnText: { color: '#D32F2F', fontWeight: 'bold' }
});
