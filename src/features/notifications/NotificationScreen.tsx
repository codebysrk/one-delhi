import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/layout/Screen';
import { Header } from '../../components/layout/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../theme/theme';
const ICON_MAP: Record<string, JSX.Element> = {
  alert: <MaterialCommunityIcons name="alert" color="#C0282C" size={22} />,
  info: <MaterialCommunityIcons name="information" color="#3B82F6" size={22} />,
  bus: <MaterialCommunityIcons name="bus" color="#10B981" size={22} />,
  announcement: <MaterialCommunityIcons name="bullhorn" color="#F59E0B" size={22} />,
  general: <MaterialCommunityIcons name="bell" color="#6B7280" size={22} />
};
export const NotificationScreen = ({
  navigation
}: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    lastSeenNotification,
    setLastSeenNotification,
    setLatestNotificationTimestamp
  } = useAppStore();
  const initialLastSeen = useRef(lastSeenNotification);
  useEffect(() => {
    const unsubscribe = db.collection('notifications').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
      if (!snapshot) return;
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setNotifications(data);
      setLoading(false);
      if (data.length > 0 && data[0].timestamp) {
        setLatestNotificationTimestamp(data[0].timestamp);
      }
    }, error => {
      console.error('[NotificationScreen] Firestore error:', error);
      setLoading(false);
    });
    return () => {
      setLastSeenNotification(Date.now());
      unsubscribe();
    };
  }, []);
  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !item.read;
    return <View style={[styles.notificationItem, isUnread && styles.unreadItem]}>
        {isUnread && <View style={styles.unreadDot} />}
        <View style={styles.iconContainer}>
          {ICON_MAP[item.type] || ICON_MAP.general}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemTime}>
              {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short'
            }) : ''}
            </Text>
          </View>
          <Text style={styles.itemMessage}>{item.message}</Text>
        </View>
      </View>;
  };
  const insets = useSafeAreaInsets();
  return <ScreenContainer noPadding ignoreTopSafe style={{
    backgroundColor: COLORS.white
  }}>
      <Header title="Notifications" onBackPress={() => navigation.goBack()} backgroundColor={COLORS.white} textColor={COLORS.text} height={50} titleStyle={{
      fontSize: 18
    }} showShadow={true} />

      {loading ? <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View> : notifications.length === 0 ? <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications available</Text>
          <View style={styles.emptyDivider} />
        </View> : <FlatList data={notifications} renderItem={renderItem} keyExtractor={item => item.id} style={{
      flex: 1
    }} contentContainerStyle={StyleSheet.flatten([styles.listContent, {
      paddingBottom: insets.bottom + 20
    }])} ItemSeparatorComponent={() => <View style={styles.divider} />} />}
    </ScreenContainer>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingVertical: 10
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFF'
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  textContainer: {
    flex: 1
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8
  },
  itemTime: {
    fontSize: 11,
    color: '#9CA3AF'
  },
  itemMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'flex-start'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000'
  },
  emptyDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
    marginTop: 12
  },
  unreadItem: {
    backgroundColor: '#FFF8F8'
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    zIndex: 1
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#000'
  }
});