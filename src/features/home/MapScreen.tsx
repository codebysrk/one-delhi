import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
  ImageBackground,
  StatusBar,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import {
  Search,
  Settings,
  Bell,
  LocateFixed,
  Bus,
  MapPin,
  Navigation,
  ArrowUp,
} from "lucide-react-native";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence
} from "react-native-reanimated";
import { useAppStore } from "../../store/useAppStore";
import dtcData from "../../data/dtc_data.json";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Collapsed height for exactly 2 items
const SHEET_MIN_HEIGHT = 210; 
// Expanded height to show more
const SHEET_FULL_HEIGHT = SCREEN_HEIGHT * 0.78; 

export const MapScreen = ({ navigation }: any) => {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  const translateY = useSharedValue(SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const cursorOpacity = useSharedValue(0);
  const { setShowFooter } = useAppStore();

  useEffect(() => {
    setShowFooter(true);
  }, []);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      translateY.value = withSpring(SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT, { damping: 20, stiffness: 150 });
    }, [])
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);
      setLoading(false);
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation);
          const js = `updateLocation(${newLocation.coords.latitude}, ${newLocation.coords.longitude});`;
          webViewRef.current?.injectJavaScript(js);
        },
      );
    })();
  }, []);

  const centerOnUser = () => {
    if (location) {
      const js = `centerMap(${location.coords.latitude}, ${location.coords.longitude});`;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  const showSheet = () => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, 0);
      translateY.value = Math.min(translateY.value, SHEET_FULL_HEIGHT + 100);
    })
    .onEnd((event) => {
      const collapsedPos = SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT;
      const springConfig = { damping: 20, stiffness: 150 };

      // If swipe down from fully expanded or near expanded
      if (translateY.value < collapsedPos * 0.7) {
        if (event.velocityY > 300) {
           translateY.value = withSpring(collapsedPos, springConfig);
        } else {
           translateY.value = withSpring(0, springConfig);
        }
      } 
      // If already collapsed or swiping down from collapsed
      else if (translateY.value > collapsedPos + 30 || event.velocityY > 500) {
        translateY.value = withSpring(SHEET_FULL_HEIGHT + 100, springConfig);
      } 
      else {
        translateY.value = withSpring(collapsedPos, springConfig);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedControlStyle = useAnimatedStyle(() => {
    const bottomPos = interpolate(
      translateY.value,
      [0, SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT, SHEET_FULL_HEIGHT + 100],
      [SHEET_FULL_HEIGHT + 40, SHEET_MIN_HEIGHT + 40, 10],
      Extrapolate.CLAMP
    );
    return { bottom: bottomPos };
  });

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #eef2f3; }
        .user-marker { width: 14px; height: 14px; background: #2196F3; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(33, 150, 243, 0.6); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${location?.coords.latitude || 28.6273}, ${location?.coords.longitude || 77.2183}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var userMarker = L.marker([${location?.coords.latitude || 28.6273}, ${location?.coords.longitude || 77.2183}], {
          icon: L.divIcon({ className: 'user-marker', iconSize: [14, 14] })
        }).addTo(map);
        function updateLocation(lat, lng) { userMarker.setLatLng(new L.LatLng(lat, lng)); }
        function centerMap(lat, lng) { map.setView([lat, lng], 17); }
      </script>
    </body>
    </html>
  `;

  const stopsToShow = dtcData.routes[0]?.stops.slice(0, 15).map((stopName, idx) => ({
    id: idx.toString(),
    name: stopName,
    dir: idx % 2 === 0 ? "towards Terminal" : "towards Cambridge Sch..."
  })) || [];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <View style={styles.headerArea}>
          <ImageBackground 
            source={require("../../../assets/images/map-header.webp")} 
            style={styles.headerBg}
            imageStyle={{ opacity: 0.8 }} // Slight opacity to allow red bg to show through
          >
            <View style={styles.darkOverlay}>
              <SafeAreaView style={styles.safeHeader}>
                <View style={styles.topBar}>
                  <View style={{ width: 40 }} />
                  <View style={styles.logoBox}>
                    <Animated.Image 
                      source={require("../../../assets/images/map-header-logo.webp")} 
                      style={{ width: 110, height: 35 }}
                      resizeMode="contain"
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.settingsIcon} 
                    onPress={() => navigation.navigate("Settings")}
                  >
                    <Settings size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <View style={styles.searchPill}>
                    <Search size={22} color="rgba(255,255,255,0.7)" style={{ marginLeft: 16 }} />
                    <Animated.View style={[styles.cursor, animatedCursorStyle, { marginLeft: 8 }]} />
                    <Text style={[styles.searchLabel, { marginLeft: 4 }]}>Search 500+ Route</Text>
                  </View>
                  <TouchableOpacity style={styles.bellBtn}>
                     <Bell size={24} color="white" />
                     <View style={styles.yellowDot} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.mapBody}>
          {loading ? (
            <View style={styles.loader}><ActivityIndicator size="large" color="#B91C1C" /></View>
          ) : (
            <WebView ref={webViewRef} originWhitelist={["*"]} source={{ html: mapHtml }} style={styles.mapWeb} scrollEnabled={false} pointerEvents="auto" />
          )}

          <Animated.View style={[styles.redArrowBtn, animatedControlStyle, { left: 20 }]}>
            <TouchableOpacity onPress={showSheet} style={styles.fabInner}>
              <ArrowUp size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.mapControls, animatedControlStyle, { right: 20 }]}>
            <TouchableOpacity style={styles.controlFab}><Bus size={24} color="#000" /></TouchableOpacity>
            <TouchableOpacity style={[styles.controlFab, { marginTop: 12 }]} onPress={centerOnUser}>
              <LocateFixed size={24} color="#000" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View style={[styles.eliteSheet, animatedSheetStyle]}>
          <GestureDetector gesture={gesture}>
            <View style={styles.dragArea}>
              <View style={styles.handleBar} />
              <View style={styles.tabBar}>
                <TouchableOpacity style={[styles.tabBtn, styles.activeTabBtn]}><Text style={styles.activeTabText}>Bus Stop</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, styles.inactiveTabBtn]}><Text style={styles.inactiveTabText}>Metro Stop</Text></TouchableOpacity>
              </View>
            </View>
          </GestureDetector>

          <ScrollView showsVerticalScrollIndicator={false} bounces={true} contentContainerStyle={styles.scrollContent}>
            {stopsToShow.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <View style={styles.stopCard}>
                  <View style={styles.stopDetails}>
                    <Text style={styles.stopMain}>{stop.name}</Text>
                    <Text style={styles.stopDir}>{stop.dir}</Text>
                  </View>
                  <TouchableOpacity style={styles.greenBtn}>
                    <Text style={styles.greenBtnText}>View Buses</Text>
                  </TouchableOpacity>
                </View>
                {index < stopsToShow.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerArea: { height: 145, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden' },
  headerBg: { flex: 1, backgroundColor: "#C0282C" },
  darkOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  safeHeader: { flex: 1, paddingTop: Platform.OS === "android" ? 25 : 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, height: 60 },
  logoBox: { alignItems: "center" },
  settingsIcon: { padding: 8 },
  searchContainer: { flexDirection: "row", paddingHorizontal: 16, alignItems: "center", marginTop: 1, gap: 12 },
  searchPill: { flex: 1, height: 50, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 25, flexDirection: "row", alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchLabel: { color: "rgba(255,255,255,0.7)", fontSize: 17, marginLeft: 12, fontWeight: '400' },
  cursor: { width: 2, height: 22, backgroundColor: 'rgba(0, 145, 106, 0.76)', marginLeft: 2 },
  bellBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  yellowDot: { position: "absolute", top: 10, right: 10, width: 8, height: 8, backgroundColor: "#FACC15", borderRadius: 4, borderWidth: 1, borderColor: "white" },
  mapBody: { flex: 1, marginTop: -28, zIndex: -1 },
  mapWeb: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  redArrowBtn: { position: 'absolute', width: 50, height: 50, backgroundColor: '#C0282C', borderRadius: 25, elevation: 5, zIndex: 10 },
  fabInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  mapControls: { position: "absolute", zIndex: 10 },
  controlFab: { width: 56, height: 56, backgroundColor: "white", borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6 },
  eliteSheet: { 
    position: "absolute", 
    bottom: -15, 
    left: 0, 
    right: 0, 
    height: SHEET_FULL_HEIGHT + 50,
    backgroundColor: "white", 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    elevation: 30, 
    zIndex: 100 
  },
  dragArea: { paddingHorizontal: 20, paddingTop: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 5 },
  handleBar: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginBottom: 15 },
  tabBar: { flexDirection: "row", gap: 10, marginBottom: 15 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22 },
  activeTabBtn: { backgroundColor: "#C0282C" },
  inactiveTabBtn: { backgroundColor: "#A3A3A3" },
  activeTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  inactiveTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  stopCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  stopDetails: { flex: 1 },
  stopMain: { fontSize: 17, fontWeight: "700", color: "#000" },
  stopDir: { fontSize: 13, color: "#666", marginTop: 2 },
  greenBtn: { borderWidth: 1.1, borderColor: "#10B981", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16 },
  greenBtnText: { color: "#10B981", fontWeight: "700", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },
});
