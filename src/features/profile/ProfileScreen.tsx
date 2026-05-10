import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';
import { RemixIcon } from '../../components/RemixIcon';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, userProfile, setUser } = useAppStore();

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
            await signOut(auth);
            setUser(null);
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: 'user-3-line', label: "Account Details", color: '#666' },
    { icon: 'history-line', label: "My History", action: () => navigation.navigate('History'), color: '#666' },
    { icon: 'chat-poll-line', label: "Give Feedback", color: '#666' },
    { icon: 'information-line', label: "About One Delhi", color: '#666' },
    ...(userProfile?.role === 'admin' ? [
      { icon: 'shield-user-line', label: "Admin Panel", action: () => navigation.navigate('Admin'), color: '#D32F2F' }
    ] : []),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Red Background Top Part */}
      <View style={styles.headerBg} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <RemixIcon name="arrow-left-line" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarBox}>
               <RemixIcon name="user-fill" size={32} color="#999" />
            </View>
            <View style={styles.userInfo}>
               <Text style={styles.userName}>{user?.displayName || 'Delhi Traveler'}</Text>
               <Text style={styles.userEmail}>{user?.email}</Text>
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
                  <RemixIcon name={item.icon as any} size={22} color={item.color} />
                  <Text style={[styles.menuLabel, item.label === 'Admin Panel' && { color: '#D32F2F' }]}>{item.label}</Text>
                </View>
                <RemixIcon name="arrow-right-s-line" size={24} color="#CCC" />
              </TouchableOpacity>
            ))}
            
            {/* Logout Row */}
            <TouchableOpacity 
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <View style={styles.menuLeft}>
                <RemixIcon name="logout-box-r-line" size={22} color="#D32F2F" />
                <Text style={[styles.menuLabel, { color: '#D32F2F', fontWeight: '600' }]}>Log Out</Text>
              </View>
              <RemixIcon name="arrow-right-s-line" size={24} color="#CCC" />
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
    backgroundColor: '#D32F2F' 
  },
  safeArea: { flex: 1 },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    height: 56,
    marginTop: Platform.OS === 'android' ? 30 : 0
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
