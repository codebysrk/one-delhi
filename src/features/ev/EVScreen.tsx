import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
  ScrollView,
} from "react-native";
import { GoogleMap, GoogleMapRef } from "../../components/ui/GoogleMap";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import * as Location from "expo-location";
import { MainHeader } from "../../components/layout/Header";

const EV_STATIONS = [
  {
    id: "1",
    name: "EESL",
    status: "0/0 AVAIL",
    distance: "9.47 KM",
    address: "Double Story Market, Maherchand L...",
    supports: "",
    lat: 28.585,
    lng: 77.234,
  },
  {
    id: "2",
    name: "EESL",
    status: "0/0 AVAIL",
    distance: "12.1 KM",
    address: "Palika Gate No. 2, Connaught Place",
    supports: "",
    lat: 28.632,
    lng: 77.218,
  },
];

export const EVScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const webViewRef = useRef<GoogleMapRef>(null);
  const [activeTab, setActiveTab] = useState<"EV" | "Parking">("EV");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (mapLoaded) {
      const stations = EV_STATIONS.map((s) => ({
        lat: s.lat,
        lng: s.lng,
        name: s.name,
      }));
      webViewRef.current?.drawEVStations(stations);
    }
  }, [mapLoaded]);

  // mapHtml removed since we now use the unified GoogleMap component

  const insets = useSafeAreaInsets();

  return (
    <Screen noPadding ignoreTopSafe style={styles.container}>

      {/* Full Screen Map as Base Layer */}
      <View style={styles.fullScreenMap}>
        <GoogleMap
          ref={webViewRef}
          userLocation={location}
          onMapLoaded={() => setMapLoaded(true)}
          style={{ flex: 1 }}
        />
      </View>

      {/* Header as Overlay */}
      <MainHeader 
        style={styles.headerOverlayContainer}
        showSearch={true}
        searchPlaceholder="Search 0+ charge points"
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>
        }
      />

      {/* Controls & Bottom Content as Overlays */}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        {/* Floating buttons */}
        <View style={styles.floatingBox}>
          <TouchableOpacity style={styles.fab}>
            <MaterialCommunityIcons name="filter" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { marginTop: 15 }]}
            onPress={() =>
              location &&
              webViewRef.current?.centerMap(location.coords.latitude, location.coords.longitude, 14)
            }
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={28}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* The White Sheet at bottom */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "EV" ? styles.activeEv : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab("EV")}
            >
              <MaterialCommunityIcons
                name="ev-station"
                size={22}
                color="white"
              />
              <Text style={styles.tabLabel}>EV Stations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "Parking"
                  ? styles.activeParking
                  : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab("Parking")}
            >
              <MaterialCommunityIcons
                name="alpha-p-circle"
                size={22}
                color="#E67E22"
              />
              <Text style={[styles.tabLabel, { color: "#333" }]}>
                Parking Spots
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
           horizontal 
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={styles.cardScroll}
           snapToInterval={Dimensions.get('window').width - 10}
           decelerationRate="fast"
           snapToAlignment="start"
           disableIntervalMomentum={true}
         >
            {EV_STATIONS.map((item) => (
              <View key={item.id} style={styles.stationCard}>
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
                    <MaterialCommunityIcons
                      name="directions"
                      size={18}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                <View style={styles.line} />
                <Text style={styles.supportsText}>Supports:</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  fullScreenMap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  headerOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerBg: { flex: 1 },
  headerOverlayColor: { flex: 1, backgroundColor: "rgba(190, 31, 31, 0.22)" },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
  },
  headerLogo: { width: 100, height: 40 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    marginHorizontal: 16,
    height: 52,
    borderRadius: 26,
    marginTop: 5,
  },
  searchInput: { flex: 1, color: "white", fontSize: 17, marginLeft: 12 },
  floatingBox: { position: "absolute", right: 20, bottom: 220, zIndex: 10 },
  fab: {
    width: 50,
    height: 50,
    backgroundColor: "white",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
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
    elevation: 20,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 24,
    elevation: 2,
  },
  activeEv: { backgroundColor: "#C0392B" },
  activeParking: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  inactiveTab: { backgroundColor: "#f0f0f0" },
  tabLabel: { color: "white", marginLeft: 8, fontSize: 13, fontWeight: "700" },
  cardScroll: { paddingLeft: 10, paddingRight: 10 },
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#333",
    marginRight: 10,
  },
  badgeContainer: { flexDirection: "row", flex: 1, gap: 5 },
  availBadge: {
    backgroundColor: "#e6f9ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availText: { color: "#27ae60", fontSize: 10, fontWeight: "700" },
  distBadge: {
    backgroundColor: "#fceaea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distText: { color: "#c0392b", fontSize: 10, fontWeight: "700" },
  navBtn: {
    backgroundColor: "#c0392b",
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "45deg" }],
  },
  cardAddress: { color: "#7f8c8d", fontSize: 13, marginBottom: 10 },
  line: { height: 1, backgroundColor: "#eee", marginBottom: 10 },
  supportsText: { color: "#888", fontSize: 12, fontWeight: "600" },
});
