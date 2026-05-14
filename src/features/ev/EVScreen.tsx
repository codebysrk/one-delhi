import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground, 
  useWindowDimensions, 
  Platform,
  StatusBar,
  ScrollView,
  TextInput
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

const SNAP_MID = 300;

const EV_STATIONS = [
  { id: '1', name: 'EESL', status: '0/0 AVAIL', distance: '9.47 KM', address: 'Double Story Market, Maherchand L...', supports: 'AC-001, DC-050', lat: 28.5850, lng: 77.2340 },
  { id: '2', name: 'Tata Power', status: '2/4 AVAIL', distance: '12.1 KM', address: 'Palika Gate No. 2, Connaught Place', supports: 'CCS-2, Type-2', lat: 28.6320, lng: 77.2180 },
  { id: '3', name: 'Magenta ChargeGrid', status: '1/2 AVAIL', distance: '5.2 KM', address: 'Sector 12, RK Puram, New Delhi', supports: 'DC-001', lat: 28.5670, lng: 77.1720 },
];

export const EVScreen = ({ navigation }: any) => {
  const { width, height } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);
  const [activeTab, setActiveTab] = useState<'EV' | 'Parking'>('EV');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  const mapHtml = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f1f5f9; }
        .ev-marker { 
          width: 34px; height: 34px; background: #10B981; 
          border: 2px solid white; border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex; justify-content: center; alignItems: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .ev-marker i { 
          transform: rotate(45deg); color: white; font-size: 18px; 
          font-family: Arial; font-style: normal; font-weight: bold;
        }
        .user-marker { 
          width: 14px; height: 14px; background: #3b82f6; 
          border: 3px solid white; border-radius: 50%; 
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([28.6139, 77.2090], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        var evIcon = L.divIcon({
          className: '',
          html: '<div class="ev-marker"><i>⚡</i></div>',
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        });

        const stations = ${JSON.stringify(EV_STATIONS)};
        stations.forEach(s => {
          L.marker([s.lat, s.lng], { icon: evIcon }).addTo(map)
            .bindPopup('<b>' + s.name + '</b><br>' + s.status);
        });

        window.centerMap = function(lat, lng) {
          map.flyTo([lat, lng], 14, { duration: 1.5 });
        };
      </script>
    </body>
    </html>
    `;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Premium Header */}
      <View style={styles.headerArea}>
        <ImageBackground 
          source={require('../../../assets/images/map-header.webp')}
          style={styles.headerBg}
        >
          <View style={styles.darkOverlay}>
            <SafeAreaView style={styles.safeHeader} edges={['top']}>
              <View style={styles.topBar}>
                <View style={{ width: 40 }} />
                <View style={styles.logoBox}>
                  <Image 
                    source={require('../../../assets/images/map-header-logo.webp')}
                    style={{ width: 100, height: 35 }}
                    contentFit="contain"
                    transition={400}
                  />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <MaterialCommunityIcons name="cog" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={24} color="white" style={styles.searchIcon} />
                <TextInput 
                  placeholder="Search 0+ charge points"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  style={styles.searchInput}
                />
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <WebView 
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
        />

        {/* Floating Controls */}
        <View style={styles.floatingControls}>
           <TouchableOpacity style={styles.controlFab}>
              <MaterialCommunityIcons name="filter-variant" size={24} color="#333" />
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.controlFab, { marginTop: 12 }]}
             onPress={() => location && webViewRef.current?.injectJavaScript(`centerMap(${location.coords.latitude}, ${location.coords.longitude})`)}
           >
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#333" />
           </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'EV' && styles.activeTab]}
             onPress={() => setActiveTab('EV')}
           >
              <MaterialCommunityIcons name="ev-station" size={22} color={activeTab === 'EV' ? 'white' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'EV' && styles.activeTabText]}>EV Stations</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'Parking' && styles.activeTab]}
             onPress={() => setActiveTab('Parking')}
           >
              <MaterialCommunityIcons name="parking" size={22} color={activeTab === 'Parking' ? 'white' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'Parking' && styles.activeTabText]}>Parking Spots</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Bottom List */}
      <View style={styles.listArea}>
         <ScrollView 
           horizontal 
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={styles.listContent}
         >
            {EV_STATIONS.map(item => (
              <View key={item.id} style={styles.stationCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.stationName}>{item.name}</Text>
                  <View style={styles.availBadge}>
                    <Text style={styles.availText}>{item.status}</Text>
                  </View>
                  <View style={styles.distBadge}>
                    <Text style={styles.distText}>{item.distance}</Text>
                  </View>
                  <TouchableOpacity style={styles.goBtn}>
                    <MaterialCommunityIcons name="directions" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                <View style={styles.divider} />
                <Text style={styles.supportsText}>Supports: <Text style={{fontWeight: '700'}}>{item.supports}</Text></Text>
              </View>
            ))}
         </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  headerArea: { height: 180, overflow: 'hidden' },
  headerBg: { width: '100%', height: '100%' },
  darkOverlay: { flex: 1, backgroundColor: 'rgba(179, 38, 30, 0.85)' },
  safeHeader: { paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  logoBox: { alignItems: 'center' },
  logoText: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  logoSub: { color: 'white', fontSize: 8, fontWeight: '700', marginTop: -2 },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 30, 
    paddingHorizontal: 15,
    height: 50,
    marginTop: 15
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: 'white', fontSize: 16 },
  mapContainer: { flex: 1, marginTop: -20, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  floatingControls: { position: 'absolute', right: 20, top: 40, zIndex: 10 },
  controlFab: { 
    width: 48, height: 48, backgroundColor: 'white', 
    borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4
  },
  tabContainer: { 
    position: 'absolute', top: 20, left: 20, right: 20, 
    flexDirection: 'row', justifyContent: 'center', gap: 10, zIndex: 10 
  },
  tabBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, flex: 1, justifyContent: 'center'
  },
  activeTab: { backgroundColor: '#B3261E' },
  tabText: { marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#666' },
  activeTabText: { color: 'white' },
  listArea: { height: 180, backgroundColor: 'transparent', position: 'absolute', bottom: 20, left: 0, right: 0 },
  listContent: { paddingHorizontal: 15, paddingBottom: 10 },
  stationCard: { 
    backgroundColor: 'white', width: 320, borderRadius: 15, 
    padding: 16, marginRight: 15, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stationName: { fontSize: 18, fontWeight: '800', color: '#111', flex: 1 },
  availBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8 },
  availText: { color: '#166534', fontSize: 11, fontWeight: '700' },
  distBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8 },
  distText: { color: '#991B1B', fontSize: 11, fontWeight: '700' },
  goBtn: { backgroundColor: '#B3261E', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  addressText: { fontSize: 13, color: '#666', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  supportsText: { fontSize: 13, color: '#444' },
});
