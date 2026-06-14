import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { GoogleMap, GoogleMapRef } from "../../components/ui/GoogleMap";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import * as Location from "expo-location";
import { MainHeader } from "../../components/layout/Header";
import { useFocusEffect } from "@react-navigation/native";
import { getEVStations, saveEVStation } from "../../services/evService";
const EV_STATIONS = [{
  id: "1",
  name: "EESL Lodhi Road",
  status: "3/4 AVAIL",
  distance: "1.2 KM",
  address: "Double Story Market, Lodhi Road, New Delhi",
  supports: "CCS2, AC Type 2",
  lat: 28.585,
  lng: 77.234
}, {
  id: "2",
  name: "EESL Palika Bazaar",
  status: "2/6 AVAIL",
  distance: "4.8 KM",
  address: "Palika Gate No. 2, Connaught Place, New Delhi",
  supports: "CCS2, CHAdeMO",
  lat: 28.632,
  lng: 77.218
}, {
  id: "3",
  name: "Tata Power Dwarka",
  status: "1/2 AVAIL",
  distance: "18.5 KM",
  address: "Sector 10 Metro Station, Dwarka, New Delhi",
  supports: "CCS2",
  lat: 28.5815,
  lng: 77.0594
}, {
  id: "4",
  name: "Magenta Charge Saket",
  status: "4/4 AVAIL",
  distance: "8.3 KM",
  address: "Select Citywalk Mall Parking, Saket, New Delhi",
  supports: "CCS2, AC Type 2",
  lat: 28.5284,
  lng: 77.2195
}, {
  id: "5",
  name: "Jio-bp Pulse Nehru Place",
  status: "2/4 AVAIL",
  distance: "6.1 KM",
  address: "Nehru Place Market Parking, New Delhi",
  supports: "CCS2, DC Fast",
  lat: 28.5494,
  lng: 77.2515
}, {
  id: "6",
  name: "Statiq Karol Bagh",
  status: "1/2 AVAIL",
  distance: "7.2 KM",
  address: "Pusa Road, Karol Bagh, New Delhi",
  supports: "AC Type 2",
  lat: 28.6532,
  lng: 77.1902
}, {
  id: "7",
  name: "Ather Grid Rajouri Garden",
  status: "5/6 AVAIL",
  distance: "12.4 KM",
  address: "Main Market, Rajouri Garden, New Delhi",
  supports: "Ather Connector",
  lat: 28.6415,
  lng: 77.1245
}, {
  id: "8",
  name: "Zeon EV Vasant Kunj",
  status: "3/4 AVAIL",
  distance: "11.2 KM",
  address: "Ambience Mall Parking, Vasant Kunj, New Delhi",
  supports: "CCS2, CHAdeMO",
  lat: 28.5412,
  lng: 77.1556
}, {
  id: "9",
  name: "Tata Power Rohini",
  status: "2/2 AVAIL",
  distance: "16.8 KM",
  address: "Sector 9, Rohini, New Delhi",
  supports: "CCS2",
  lat: 28.7161,
  lng: 77.1192
}, {
  id: "10",
  name: "Jio-bp Mayur Vihar",
  status: "0/2 AVAIL",
  distance: "10.5 KM",
  address: "Mayur Vihar Phase 1 Metro Station, New Delhi",
  supports: "CCS2",
  lat: 28.6041,
  lng: 77.2911
}];
export const EVScreen = ({
  navigation
}: any) => {
  const webViewRef = useRef<GoogleMapRef>(null);
  const hasAnimatedOnLoad = useRef(false);
  const [activeTab, setActiveTab] = useState<"EV" | "Parking">("EV");
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [stations, setStations] = useState<any[]>(EV_STATIONS);
  useEffect(() => {
    (async () => {
      let {
        status
      } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const list = await getEVStations();
        if (list.length > 0) {
          setStations(list);
        } else {
          console.log("[EVScreen] ev_stations Firestore collection is empty. Auto-seeding...");
          for (const station of EV_STATIONS) {
            try {
              await saveEVStation(station);
            } catch (seedErr) {
              console.log("[EVScreen] Failed to seed station:", station.name, seedErr);
            }
          }
          const refetchedList = await getEVStations();
          if (refetchedList.length > 0) {
            setStations(refetchedList);
          }
        }
      } catch (err) {
        console.log("[EVScreen] Error fetching EV stations:", err);
      }
    };
    fetchStations();
  }, []);
  useEffect(() => {
    if (mapLoaded) {
      const pins = stations.map(s => ({
        lat: s.lat,
        lng: s.lng,
        name: s.name
      }));
      webViewRef.current?.drawEVStations(pins);
    }
  }, [mapLoaded, stations]);
  useEffect(() => {
    if (mapLoaded && !hasAnimatedOnLoad.current) {
      hasAnimatedOnLoad.current = true;
      const timer = setTimeout(() => {
        webViewRef.current?.triggerFocusAnimation(28.6139, 77.2090, 11);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded]);
  useFocusEffect(useCallback(() => {
    if (mapLoaded) {
      if (!hasAnimatedOnLoad.current) return;
      const timer = setTimeout(() => {
        webViewRef.current?.triggerFocusAnimation(28.6139, 77.2090, 11);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded]));
  const insets = useSafeAreaInsets();
  return <Screen noPadding ignoreTopSafe style={styles.container}>

      {}
      <View style={styles.fullScreenMap}>
        <GoogleMap ref={webViewRef} userLocation={location} onMapLoaded={() => setMapLoaded(true)} style={{
        flex: 1
      }} animateOnLoad={true} />
      </View>

      {}
      <MainHeader style={styles.headerOverlayContainer} showSearch={true} searchPlaceholder="Search EV charge points" rightElement={<TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", {
      screen: "Settings"
    })}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>} />

      {}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        {}
        <View style={styles.floatingBox}>
          <TouchableOpacity style={styles.fab}>
            <MaterialCommunityIcons name="filter" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, {
          marginTop: 15
        }]} onPress={() => location && webViewRef.current?.centerMap(location.coords.latitude, location.coords.longitude, 14)}>
            <MaterialCommunityIcons name="crosshairs-gps" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {}
        <View style={[styles.bottomSheet, {
        paddingBottom: insets.bottom + 10
      }]}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === "EV" ? styles.activeEv : styles.inactiveTab]} onPress={() => setActiveTab("EV")}>
              <MaterialCommunityIcons name="ev-station" size={22} color="white" />
              <Text style={styles.tabLabel}>EV Stations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === "Parking" ? styles.activeParking : styles.inactiveTab]} onPress={() => setActiveTab("Parking")}>
              <MaterialCommunityIcons name="alpha-p-circle" size={22} color="#E67E22" />
              <Text style={[styles.tabLabel, {
              color: "#333"
            }]}>
                Parking Spots
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll} snapToInterval={Dimensions.get('window').width - 10} decelerationRate="fast" snapToAlignment="start" disableIntervalMomentum={true}>
            {stations.map(item => <TouchableOpacity key={item.id} style={styles.stationCard} activeOpacity={0.9} onPress={() => {
            webViewRef.current?.centerMap(item.lat, item.lng, 14);
          }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.availBadge}>
                      <Text style={styles.availText}>{item.status}</Text>
                    </View>
                    <View style={styles.distBadge}>
                      <Text style={styles.distText}>{item.distance}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.navBtn}>
                    <MaterialCommunityIcons name="directions" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                <View style={styles.line} />
                <Text style={styles.supportsText}>Supports: {item.supports || "All Standard EVs"}</Text>
              </TouchableOpacity>)}
          </ScrollView>
        </View>
      </View>
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  fullScreenMap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  headerOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden"
  },
  headerBg: {
    flex: 1
  },
  headerOverlayColor: {
    flex: 1,
    backgroundColor: "rgba(190, 31, 31, 0.22)"
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16
  },
  headerLogo: {
    width: 100,
    height: 40
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    marginHorizontal: 16,
    height: 52,
    borderRadius: 26,
    marginTop: 5
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 17,
    marginLeft: 12
  },
  floatingBox: {
    position: "absolute",
    right: 20,
    bottom: 220,
    zIndex: 10
  },
  fab: {
    width: 50,
    height: 50,
    backgroundColor: "white",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: 5,
    elevation: 20
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 10
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 24,
    elevation: 2
  },
  activeEv: {
    backgroundColor: "#C0392B"
  },
  activeParking: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd"
  },
  inactiveTab: {
    backgroundColor: "#f0f0f0"
  },
  tabLabel: {
    color: "white",
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700"
  },
  cardScroll: {
    paddingLeft: 10,
    paddingRight: 10
  },
  stationCard: {
    width: Dimensions.get("window").width - 20,
    minHeight: 140,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 15,
    marginRight: 10,
    borderWidth: 1,
    elevation: 1,
    borderColor: "#eee",
    shadowColor: "#000000ff",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.5,
    shadowRadius: 2
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#333",
    marginRight: 10
  },
  badgeContainer: {
    flexDirection: "row",
    flex: 1,
    gap: 5
  },
  availBadge: {
    backgroundColor: "#e6f9ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  availText: {
    color: "#27ae60",
    fontSize: 10,
    fontWeight: "700"
  },
  distBadge: {
    backgroundColor: "#fceaea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  distText: {
    color: "#c0392b",
    fontSize: 10,
    fontWeight: "700"
  },
  navBtn: {
    backgroundColor: "#c0392b",
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    transform: [{
      rotate: "45deg"
    }]
  },
  cardAddress: {
    color: "#7f8c8d",
    fontSize: 13,
    marginBottom: 10
  },
  line: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 10
  },
  supportsText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600"
  }
});