import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Platform, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAppStore } from '../../store/useAppStore';

const ICON_MAP: Record<string, JSX.Element> = {
  alert: <MaterialCommunityIcons name="alert" color="#C0282C" size={22} />,
  info: <MaterialCommunityIcons name="information" color="#3B82F6" size={22} />,
  bus: <MaterialCommunityIcons name="bus" color="#10B981" size={22} />,
  announcement: <MaterialCommunityIcons name="bullhorn" color="#F59E0B" size={22} />,
  general: <MaterialCommunityIcons name="bell" color="#6B7280" size={22} />,
};

export const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastSeenNotification, setLastSeenNotification, setLatestNotificationTimestamp } = useAppStore();
  
  // Keep track of what was seen before this session
  const initialLastSeen = useRef(lastSeenNotification);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setLoading(false);

      // Update latest notification timestamp if we have data
      if (data.length > 0 && data[0].timestamp) {
        setLatestNotificationTimestamp(data[0].timestamp);
      }
    }, (error) => {
      console.error('[NotificationScreen] Firestore error:', error);
      setLoading(false);
    });

    // Mark as read when leaving the screen
    return () => {
      setLastSeenNotification(Date.now());
      unsubscribe();
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = item.timestamp > initialLastSeen.current;
    
    return (
      <View style={[styles.notificationItem, isUnread && styles.unreadItem]}>
        {isUnread && <View style={styles.unreadDot} />}
        <View style={styles.iconContainer}>
          {ICON_MAP[item.type] || ICON_MAP['general']}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemTime}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
          </Text>
        </View>
        <Text style={styles.itemMessage}>{item.message}</Text>
      </View>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="yellow" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D32F2F" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={100}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell" color="#CCC" size={60} />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 10 },
  notificationItem: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  itemTime: { fontSize: 11, color: '#9CA3AF' },
  itemMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999', fontWeight: '500' },
  unreadItem: {
    backgroundColor: '#FFF8F8', // Very light red tint
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
    zIndex: 1,
  },
  unreadTitle: {
    fontWeight: '800', // Extra bold for unread
    color: '#000',
  },
});
