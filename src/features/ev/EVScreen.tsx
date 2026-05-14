import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Screen } from '../../components/Screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MetroLogo } from '../../components/MetroLogo';



const HUB_SERVICES = [
  { id: '1', name: 'Bus', icon: 'bus', color: '#FFB74D' },
  { id: '2', name: 'Metro', icon: 'metro', color: '#D32F2F' },
  { id: '3', name: 'EV', icon: 'ev-station', color: '#4CAF50' },
  { id: '4', name: 'Auto', icon: 'taxi', color: '#FBC02D' },
  { id: '5', name: 'Cab', icon: 'car', color: '#111' },
  { id: '6', name: 'Cycle', icon: 'bicycle', color: '#03A9F4' },
];

export const EVScreen = () => {
  const { width } = useWindowDimensions();
  const ITEM_WIDTH = (width - 60) / 3;
  return (
    <Screen 
      noPadding 
      backgroundColor="#F8F9FA" 
      scrollable
      header={
        <View style={styles.header}>
          <Text style={styles.title}>Delhi Transport Hub</Text>
          <Text style={styles.subtitle}>Explore all transport services in one place</Text>
        </View>
      }
    >
      <View style={styles.gridContainer}>
        {HUB_SERVICES.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.serviceItem, { width: ITEM_WIDTH }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
              {item.icon === 'metro' ? (
                <MetroLogo size={32} />
              ) : (
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              )}
            </View>
            <Text style={styles.serviceName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Promotions Section */}
      <View style={styles.promoContainer}>
         <View style={styles.promoCard}>
            <Text style={styles.promoTitle}>Book Your EV Now</Text>
            <Text style={styles.promoDesc}>Sustainable rides for a cleaner Delhi</Text>
            <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Book Now</Text>
            </TouchableOpacity>
         </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { 
    padding: 25, 
    backgroundColor: '#FFF', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 15, 
    justifyContent: 'space-between',
    marginTop: 20
  },
  serviceItem: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#333' },
  promoContainer: { padding: 20 },
  promoCard: { 
    backgroundColor: '#D32F2F', 
    borderRadius: 20, 
    padding: 20,
    elevation: 8
  },
  promoTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  promoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
  promoBtn: { 
    backgroundColor: 'white', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 25, 
    marginTop: 15 
  },
  promoBtnText: { color: '#D32F2F', fontWeight: '700' }
});

