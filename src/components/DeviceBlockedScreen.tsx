import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const DeviceBlockedScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="shield-alert-outline" size={80} color="#D32F2F" />
      </View>
      
      <Text style={styles.title}>Unauthorized Device</Text>
      <Text style={styles.message}>
        This device is not authorized to run the One Delhi application. Please contact your administrator for approval.
      </Text>

      <TouchableOpacity 
        style={styles.contactBtn}
        onPress={() => Linking.openURL('tel:+911123456789')}
      >
        <MaterialCommunityIcons name="phone" size={20} color="white" />
        <Text style={styles.contactBtnText}>Contact Support</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Device ID: Hidden for Security</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconContainer: {
    backgroundColor: '#FFEBEE',
    padding: 30,
    borderRadius: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  contactBtn: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    gap: 10,
  },
  contactBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    color: '#999',
    fontSize: 12,
  }
});
