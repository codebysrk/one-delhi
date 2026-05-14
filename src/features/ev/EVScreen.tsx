import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Location from "expo-location";

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
  const webViewRef = useRef<WebView>(null);
  const [activeTab, setActiveTab] = useState<"EV" | "Parking">("EV");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
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
          width: 32px; height: 32px; background: #10B981; 
          border: 2.5px solid white; border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex; justify-content: center; alignItems: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .ev-marker i { 
          transform: rotate(45deg); color: #000; font-size: 16px; 
          font-family: Arial; font-style: normal; font-weight: bold;
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
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const stations = ${JSON.stringify(EV_STATIONS)};
        stations.forEach(s => {
          L.marker([s.lat, s.lng], { icon: evIcon }).addTo(map);
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
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Full Screen Map as Base Layer */}
      <View style={styles.fullScreenMap}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Header as Overlay */}
      <View style={styles.headerOverlayContainer}>
        <ImageBackground
          source={require("../../../assets/images/map-header.webp")}
          style={styles.headerBg}
          imageStyle={{ opacity: 1 }}
        >
          <View style={styles.headerOverlayColor}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
              <View style={styles.topBar}>
                <View style={{ width: 40 }} />
                <Image
                  source={require("../../../assets/images/map-header-logo.webp")}
                  style={styles.headerLogo}
                  contentFit="contain"
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate("Settings")}
                >
                  <MaterialCommunityIcons name="cog" size={26} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={26}
                  color="white"
                  style={{ marginLeft: 15 }}
                />
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

      {/* Controls & Bottom Content as Overlays */}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        {/* Floating buttons */}
        <View style={styles.floatingBox}>
          <TouchableOpacity style={styles.fab}>
            <MaterialCommunityIcons
              name="filter"
              size={28}
              color="#333"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { marginTop: 15 }]}
            onPress={() =>
              location &&
              webViewRef.current?.injectJavaScript(
                `centerMap(${location.coords.latitude}, ${location.coords.longitude})`,
              )
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
        <View style={styles.bottomSheet}>
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
    </View>
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
    height: 160,
    zIndex: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerBg: { flex: 1 },
  headerOverlayColor: { flex: 1, backgroundColor: "rgba(168, 28, 20, 0.7)" },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 15,
  },
  headerLogo: { width: 100, height: 40 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    marginHorizontal: 15,
    height: 52,
    borderRadius: 26,
    marginTop: 5,
  },
  searchInput: { flex: 1, color: "white", fontSize: 17, marginLeft: 12 },
  floatingBox: { position: "absolute", right: 20, bottom: 230, zIndex: 10 },
  fab: {
    width: 54,
    height: 54,
    backgroundColor: "white",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    marginBottom: 25,
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
  cardScroll: { paddingLeft: 20, paddingRight: 10 },
  stationCard: { 
    width: Dimensions.get('window').width - 40, backgroundColor: 'white', borderRadius: 15, padding: 10, marginRight: 20,
    borderWidth: 1, borderColor: '#eee', elevation: 3, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 5
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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
