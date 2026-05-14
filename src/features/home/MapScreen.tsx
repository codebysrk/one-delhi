import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  ImageBackground,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { FlashList } from "@shopify/flash-list";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useAppStore } from "../../store/useAppStore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

const SHEET_MIN_HEIGHT = 210;

export const MapScreen = ({ navigation }: any) => {
  const { width, height: SCREEN_HEIGHT } = useWindowDimensions();
  const SHEET_FULL_HEIGHT = SCREEN_HEIGHT * 0.78;
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const translateY = useSharedValue(SCREEN_HEIGHT * 0.78 - SHEET_MIN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const cursorOpacity = useSharedValue(0);
  const { setShowFooter, lastSeenNotification, latestNotificationTimestamp } = useAppStore();

  useEffect(() => {
    setShowFooter(true);
  }, []);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      translateY.value = withSpring(SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT, {
        damping: 20,
        stiffness: 150,
      });
    }, []),
  );

  useEffect(() => {
    let locationWatcher: Location.LocationSubscription | null = null;

    const initializeLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoading(false);
          return;
        }

        // 1. Get last known position for instant load (most reliable)
        try {
          let lastLocation = await Location.getLastKnownPositionAsync({});
          if (lastLocation) {
            setLocation(lastLocation);
            setLoading(false);
            webViewRef.current?.injectJavaScript(`centerMap(${lastLocation.coords.latitude}, ${lastLocation.coords.longitude});`);
          }
        } catch (e) {
          if (__DEV__) console.warn("Last known position unavailable");
        }

        // 2. Try to get current position with a timeout and lower accuracy fallback
        try {
          let initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(initialLocation);
          setLoading(false);
          webViewRef.current?.injectJavaScript(`centerMap(${initialLocation.coords.latitude}, ${initialLocation.coords.longitude});`);
        } catch (e) {
          if (__DEV__) console.warn("Current position request failed, using last known if available");
        }

        // 3. Start watching position with safety
        try {
          locationWatcher = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
            (newLocation) => {
              setLocation(newLocation);
              webViewRef.current?.injectJavaScript(`updateLocation(${newLocation.coords.latitude}, ${newLocation.coords.longitude});`);
            },
          );
        } catch (e) {
          if (__DEV__) console.error("Position watcher failed:", e);
        }
      } catch (error) {
        if (__DEV__) console.error("Fatal location initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeLocation();

    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
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
      } else {
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
      Extrapolate.CLAMP,
    );
    return { bottom: bottomPos };
  });

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
        #map { height: 100vh; width: 100vw; background: #f8fafc; }
        .stop-marker { 
          width: 12px; height: 12px; background: #B91C1C; 
          border: 2px solid white; border-radius: 50%; 
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
        }
        .metro-marker { 
          width: 14px; height: 14px; background: #0072BC; 
          border: 2px solid white; border-radius: 2px; 
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
        }
        .user-marker { 
          width: 18px; height: 18px; background: #3B82F6; 
          border: 3px solid white; border-radius: 50%; 
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([28.6139, 77.2090], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        
        var userMarker = L.marker([28.6139, 77.2090], {
          icon: L.divIcon({ className: 'user-marker', iconSize: [18, 18] })
        }).addTo(map);

        window.centerMap = function(lat, lng) {
          map.setView([lat, lng], 16);
          userMarker.setLatLng([lat, lng]);
        };
      </script>
    </body>
    </html>
    `;
  }, []);


  const [stopsToShow, setStopsToShow] = useState<any[]>([]);

  // Fetch stops from Firestore (with local fallback)
  useEffect(() => {
    const fetchStops = async () => {
      const { cachedStops, setCachedStops } = useAppStore.getState();
      
      // 1. Load from cache first for instant UI
      if (cachedStops && cachedStops.length > 0) {
        setStopsToShow(cachedStops);
      }

      try {
        // 2. Fetch fresh data from Firestore
        const querySnapshot = await getDocs(collection(db, "routes"));
        const allStops: any[] = [];
        
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          const stops = data.directions?.up?.stops || data.stops;
          if (stops && Array.isArray(stops)) {
            stops.slice(0, 10).forEach((stopName: string, idx: number) => {
              allStops.push({
                id: `${doc.id}-${idx}`,
                name: stopName,
                dir: "towards Cambridge School",
              });
            });
          }
        });
        
        if (allStops.length > 0) {
          const finalStops = allStops.slice(0, 50);
          setStopsToShow(finalStops);
          setCachedStops(finalStops); // Update persistent cache
        }
      } catch (error) {
        if (__DEV__) console.error("Error fetching stops for MapScreen:", error);
        // Fallback is already showing from cachedStops
      }
    };

    fetchStops();
  }, []);

  const renderStopItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View key={item.id}>
        <View style={styles.stopCard}>
          <View style={styles.stopDetails}>
            <Text style={styles.stopMain}>{item.name}</Text>
            <Text style={styles.stopDir}>{item.dir}</Text>
          </View>
          <TouchableOpacity style={styles.greenBtn}>
            <Text style={styles.greenBtnText}>View Buses</Text>
          </TouchableOpacity>
        </View>
        {index < stopsToShow.length - 1 && <View style={styles.divider} />}
      </View>
    ),
    [stopsToShow.length],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.headerArea}>
        <ImageBackground
          source={require("../../../assets/images/map-header.webp")}
          style={styles.headerBg}
          imageStyle={{ opacity: 0.8 }}
        >
          <View style={styles.darkOverlay}>
            <SafeAreaView
              style={styles.safeHeader}
              edges={["top", "left", "right"]}
            >
              <View style={styles.topBar}>
                <View style={{ width: 40 }} />
                <View style={styles.logoBox}>
                  <Animated.Image
                    source={require("../../../assets/images/map-header-logo.webp")}
                    style={{ width: 100, height: 35, marginTop: 0 }}
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  style={styles.settingsIcon}
                  onPress={() => navigation.navigate("Settings")}
                >
                  <MaterialCommunityIcons name="cog" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <TouchableOpacity 
                  style={styles.searchPill}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("Search")}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                    style={{ marginLeft: 16 }}
                  />
                  <Animated.View
                    style={[
                      styles.cursor,
                      animatedCursorStyle,
                      { marginLeft: 8 },
                    ]}
                  />
                  <Text style={[styles.searchLabel, { marginLeft: 4 }]}>
                    Search 500+ Route
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
                  <MaterialCommunityIcons name="bell-outline" size={28} color="white" />
                  {latestNotificationTimestamp > lastSeenNotification && (
                    <View style={styles.yellowDot} />
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.mapBody}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          onLoadEnd={async () => {
            const loc = await Location.getCurrentPositionAsync({});
            if (loc) {
              const { latitude, longitude } = loc.coords;
              webViewRef.current?.injectJavaScript(`centerMap(${latitude}, ${longitude});`);
            }
          }}
        />

        <Animated.View
          style={[styles.redArrowBtn, animatedControlStyle, { left: 20 }]}
        >
          <TouchableOpacity onPress={showSheet} style={styles.fabInner}>
            <MaterialCommunityIcons name="arrow-up-circle" size={40} color="#b92121ff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.mapControls, animatedControlStyle, { right: 20 }]}
        >
          <TouchableOpacity style={styles.controlFab}>
            <MaterialCommunityIcons name="bus" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlFab, { marginTop: 12 }]}
            onPress={centerOnUser}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.eliteSheet,
          animatedSheetStyle,
          { height: SHEET_FULL_HEIGHT + 50 },
        ]}
      >
        <GestureDetector gesture={gesture}>
          <View style={styles.dragArea}>
            <View style={styles.handleBar} />
            <View style={styles.tabBar}>
              <TouchableOpacity style={[styles.tabBtn, styles.activeTabBtn]}>
                <Text style={styles.activeTabText}>Bus Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, styles.inactiveTabBtn]}>
                <Text style={styles.inactiveTabText}>Metro Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureDetector>

        <FlashList
          data={stopsToShow}
          renderItem={renderStopItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={70}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerArea: {
    height: 150,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerBg: { flex: 1, backgroundColor: "#C0282C" },
  darkOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  safeHeader: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 8,
    height: 60,
    marginTop: 0,
  },
  logoBox: { alignItems: "center" },
  settingsIcon: { padding: 8 },
  searchContainer: {
    flexDirection: "row",
    paddingLeft: 16,
    paddingRight: 8,
    alignItems: "center",
    marginTop: 0,
    gap: 12,
  },
  searchPill: {
    flex: 1,
    height: 45,
    backgroundColor: "rgba(27, 27, 27, 0.19)",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 17,
    marginLeft: 12,
    fontWeight: "400",
  },
  cursor: {
    width: 2,
    height: 22,
    backgroundColor: "rgba(0, 145, 106, 0.76)",
    marginLeft: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  yellowDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: "#FACC15",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "white",
  },
  mapBody: { flex: 1, marginTop: -28, zIndex: -1 },
  mapWeb: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  redArrowBtn: {
    position: "absolute",
    zIndex: 10,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mapControls: { position: "absolute", zIndex: 10 },
  controlFab: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  eliteSheet: {
    position: "absolute",
    bottom: -15,
    left: 0,
    right: 0,
    // height moved to inline style for dynamic calculation
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 30,
    zIndex: 100,
  },
  dragArea: { paddingHorizontal: 20, paddingTop: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 5 },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  tabBar: { flexDirection: "row", gap: 10, marginBottom: 15 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22 },
  activeTabBtn: { backgroundColor: "#C0282C" },
  inactiveTabBtn: { backgroundColor: "#A3A3A3" },
  activeTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  inactiveTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  stopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  stopDetails: { flex: 1 },
  stopMain: { fontSize: 17, fontWeight: "700", color: "#000" },
  stopDir: { fontSize: 13, color: "#666", marginTop: 2 },
  greenBtn: {
    borderWidth: 1.1,
    borderColor: "#10B981",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  greenBtnText: { color: "#10B981", fontWeight: "700", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },
});
