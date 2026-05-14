import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { db } from '../../services/firebase';
import { getRouteNumberOnly, formatStopName } from '../../utils/ticketHelper';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, startAt, endAt, getDocs, limit } from 'firebase/firestore';

interface SearchResult {
  id: string;
  type: 'route' | 'stop';
  title: string;
  startStop: string;
  endStop: string;
  stops: string[];
}

export const SearchScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const uniqueIds = new Set();
      
      if (searchQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      // Search in Firebase (Prefix Search)
      const filteredResults: SearchResult[] = [];
      try {
        // 1. Search Routes
        const qRoutes = query(
          collection(db, "routes"), 
          orderBy("id"),
          startAt(searchQuery.toUpperCase()),
          endAt(searchQuery.toUpperCase() + '\uf8ff'),
          limit(10)
        );
        
        const routeSnap = await getDocs(qRoutes);
        routeSnap.forEach(doc => {
          const data = doc.data();
          if (data && (data.id || data.routeNumber) && !uniqueIds.has(`route-${data.id || data.routeNumber}`)) {
            const stops = Array.isArray(data.stopSequence) ? data.stopSequence : (Array.isArray(data.stops) ? data.stops : []);
            const routeId = data.id || data.routeNumber;
            uniqueIds.add(`route-${routeId}`);
            filteredResults.push({
              id: `route-${routeId}`,
              type: 'route',
              title: routeId,
              startStop: formatStopName(data.origin || (stops.length > 0 ? stops[0] : 'N/A')),
              endStop: formatStopName(data.destination || (stops.length > 0 ? stops[stops.length - 1] : 'N/A')),
              stops: stops,
              direction: data.direction || (routeId && typeof routeId === 'string' && routeId.endsWith('UP') ? 'UP' : (routeId && typeof routeId === 'string' && routeId.endsWith('DOWN') ? 'DOWN' : ''))
            } as any);
          }
        });

        // 2. Search Stops
        const qStops = query(
          collection(db, "stops"),
          orderBy("name"),
          startAt(searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)), // Capitalize first letter for stop names
          endAt(searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1) + '\uf8ff'),
          limit(10)
        );

        const stopSnap = await getDocs(qStops);
        stopSnap.forEach(doc => {
          const data = doc.data();
          if (data && data.name && !uniqueIds.has(`stop-${doc.id}`)) {
            uniqueIds.add(`stop-${doc.id}`);
            filteredResults.push({
              id: `stop-${doc.id}`,
              type: 'stop',
              title: formatStopName(data.name),
              startStop: 'Bus Stop',
              endStop: '',
              stops: []
            });
          }
        });

      } catch (e) {
        console.error("Firebase Search Error:", e);
      }

      setResults(filteredResults);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultPress = (item: SearchResult) => {
    navigation.navigate("RouteDetail", { routeData: item });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" color="#333" size={24} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            placeholderTextColor="#999"
          />
        </View>

        <FlashList
          data={results}
          keyExtractor={(item) => item.id}
          estimatedItemSize={90}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.routeItem}
              onPress={() => handleResultPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.leftColumn}>
                {item.type === 'route' ? (
                  <>
                    <MaterialCommunityIcons name="bus" color="#555" size={24} />
                    <View style={styles.routeLineContainer}>
                      <MaterialCommunityIcons name="circle-outline" size={10} color="#C0282C" />
                      <View style={styles.verticalLine} />
                      <MaterialCommunityIcons name="circle-outline" size={10} color="#C0282C" />
                    </View>
                  </>
                ) : (
                  <MaterialCommunityIcons name="map-marker" color="#C0282C" size={28} />
                )}
              </View>

              <View style={styles.rightColumn}>
                <View style={styles.routeHeaderRow}>
                  <Text style={styles.routeNumber}>
                    {item.type === 'route' ? getRouteNumberOnly(item.title) : item.title}
                  </Text>
                  {item.type === 'route' && (item.id.includes('UP') || item.id.includes('DOWN')) ? (
                    <View style={[styles.directionBadge, { backgroundColor: item.id.includes('UP') ? '#E8F5E9' : '#FFF3E0' }]}>
                      <Text style={[styles.directionText, { color: item.id.includes('UP') ? '#2E7D32' : '#E65100' }]}>
                        {item.id.includes('UP') ? 'UP' : 'DOWN'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.stopsWrapper}>
                  {item.type === 'route' ? (
                    <>
                      <Text style={styles.stopText} numberOfLines={1}>
                        <Text style={{ fontWeight: '500', color: '#333' }}>From: </Text>{item.startStop}
                      </Text>
                      <Text style={[styles.stopText, { marginTop: 4 }]} numberOfLines={1}>
                        <Text style={{ fontWeight: '500', color: '#333' }}>To: </Text>{item.endStop}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.stopText}>Bus Stop</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
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
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    fontWeight: '400',
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  leftColumn: {
    alignItems: 'center',
    width: 40,
    marginRight: 15,
  },
  routeLineContainer: {
    alignItems: 'center',
    marginTop: 8,
    flex: 1,
  },
  verticalLine: {
    width: 2,
    height: 25,
    backgroundColor: '#C0282C',
    marginVertical: 2,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stopText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '400',
  },
});
