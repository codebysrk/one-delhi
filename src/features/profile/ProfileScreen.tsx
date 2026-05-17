import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logAction } from '../../services/logService';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, userProfile, deviceId, resetStore } = useAppStore();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Log before signing out
              await logAction({
                userId: user?.uid || '',
                userName: userProfile?.name || user?.displayName || 'User',
                userEmail: user?.email || '',
                action: 'LOGOUT',
                details: 'User logged out',
                type: 'USER',
                deviceId: deviceId || undefined,
              });
            } catch {}
            await signOut(auth);
            resetStore();
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: 'account-details-outline', label: "Account Details", action: () => navigation.navigate('Settings'), color: '#666' },
    { icon: 'history', label: "My History", action: () => navigation.navigate('History'), color: '#666' },
    { icon: 'help-circle-outline', label: "Help & Support", action: () => navigation.navigate('Help'), color: '#666' },
    { icon: 'information-outline', label: "About One Delhi", color: '#666', action: undefined },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="yellow" translucent />
      
      {/* Red Background Top Part */}
      <View style={styles.headerBg} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarBox}>
               <MaterialCommunityIcons name="account" size={32} color="#999" />
            </View>
            <View style={styles.userInfo}>
               <Text style={styles.userName}>{userProfile?.name || user?.displayName || 'Delhi Traveler'}</Text>
               <Text style={styles.userEmail}>{userProfile?.email || user?.email}</Text>
               {userProfile?.phone ? <Text style={styles.userPhone}>{userProfile.phone}</Text> : null}
            </View>
          </View>

          {/* Menu List */}
          <View style={styles.menuBox}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.menuRow}
                onPress={item.action}
              >
                <View style={styles.menuLeft}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                  <Text style={[styles.menuLabel, item.label === 'Admin Panel' && { color: '#D32F2F' }]}>{item.label}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
              </TouchableOpacity>
            ))}
            
            {/* Logout Row */}
            <TouchableOpacity 
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <View style={styles.menuLeft}>
                <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
                <Text style={[styles.menuLabel, { color: '#D32F2F', fontWeight: '600' }]}>Log Out</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerBg: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 160, 
    backgroundColor: '#A51F38' 
  },
  safeArea: { flex: 1 },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    height: 56,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '600' },
  scroll: { flex: 1 },
  userCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginTop: 20, 
    borderRadius: 12, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  avatarBox: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userInfo: { marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: '700', color: '#111' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  userPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  menuBox: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginTop: 20, 
    borderRadius: 12, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { marginLeft: 15, fontSize: 15, color: '#333', fontWeight: '500' },
});
