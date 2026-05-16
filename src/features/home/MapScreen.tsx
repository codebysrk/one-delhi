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
  StatusBar,
  useWindowDimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { FlashList } from "@shopify/flash-list";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedReaction,
  runOnJS,
  FadeInRight,
} from "react-native-reanimated";
import { useAppStore } from "../../store/useAppStore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { EliteBottomSheet } from "../../components/layout/EliteBottomSheet";
import { MainHeader } from "../../components/layout/MainHeader";

const SHEET_MIN_HEIGHT = 210;

export const MapScreen = ({ navigation }: any) => {
  const { width, height: SCREEN_HEIGHT } = useWindowDimensions();

  const SHEET_FULL_HEIGHT = SCREEN_HEIGHT * 0.85;
  const SHEET_HALF_HEIGHT = SHEET_FULL_HEIGHT * 0.65;
  const SNAP_TOP = 0;
  const SNAP_MID = SHEET_FULL_HEIGHT - SHEET_HALF_HEIGHT + 250;
  const SNAP_BOTTOM = SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT + 250;

  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [stopsToShow, setStopsToShow] = useState<any[]>([]);

  const translateY = useSharedValue(SNAP_MID);
  const [canScroll, setCanScroll] = useState(false);

  const { setShowFooter, lastSeenNotification, latestNotificationTimestamp } =
    useAppStore();

  useEffect(() => {
    setShowFooter(true);
  }, []);

  useAnimatedReaction(
    () => translateY.value,
    (val) => {
      if (val <= SNAP_TOP + 5) {
        if (!canScroll) runOnJS(setCanScroll)(true);
      } else {
        if (canScroll) runOnJS(setCanScroll)(false);
      }
    },
    [canScroll],
  );

  const updateMapRegion = useCallback((loc: Location.LocationObject) => {
    webViewRef.current?.injectJavaScript(
      `centerMap(${loc.coords.latitude}, ${loc.coords.longitude});`,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      translateY.value = withSpring(SNAP_MID, { damping: 25, stiffness: 180 });
    }, []),
  );

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "One Delhi needs location access to show you nearby stops.",
          );
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
        updateMapRegion(loc);
      } catch (error) {
        console.log("Location fetch error:", error);
        // Don't alert here as it might be annoying on every reload, but log it
      } finally {
        setLoading(false);
      }
    };
    initializeLocation();
  }, []);

  const centerOnUser = () => {
    if (location) {
      webViewRef.current?.injectJavaScript(
        `centerMap(${location.coords.latitude}, ${location.coords.longitude});`,
      );
    }
  };

  const showSheet = () => {
    translateY.value = withSpring(SNAP_MID, { damping: 25, stiffness: 180 });
  };

  const animatedRedArrowStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(
      0,
      SHEET_FULL_HEIGHT + 35 - translateY.value,
    );
    const opacity = interpolate(
      translateY.value,
      [SNAP_MID, SNAP_BOTTOM],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return {
      bottom: visibleHeight + 8,
      zIndex: 110,
      opacity: opacity,
      transform: [{ scale: opacity }],
    };
  });

  const animatedMapControlsStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(
      0,
      SHEET_FULL_HEIGHT + 35 - translateY.value,
    );
    return { bottom: visibleHeight + 10, zIndex: 110 };
  });

  const mapHtml = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f1f5f9; }
        .stop-marker { width: 10px; height: 10px; background: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.2); }
        .user-marker { width: 14px; height: 14px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([28.6139, 77.2090], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
        var userMarker = L.marker([28.6139, 77.2090], {
          icon: L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [14, 14] })
        }).addTo(map);
        window.centerMap = function(lat, lng) {
          map.flyTo([lat, lng], 16, { duration: 1.5 });
          userMarker.setLatLng([lat, lng]);
        };
        var stopMarkers = L.layerGroup().addTo(map);
        var stopIcon = L.divIcon({ className: '', html: '<div class="stop-marker"></div>', iconSize: [12, 12] });
        window.updateStops = function(stopsJson) {
          stopMarkers.clearLayers();
          JSON.parse(stopsJson).forEach(function(s) {
            L.marker([s.lat, s.lng], { icon: stopIcon }).bindPopup(s.name).addTo(stopMarkers);
          });
        };
      </script>
    </body>
    </html>
  `,
    [],
  );

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "routes"));
        const allStops: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const stops = data.directions?.up?.stops || data.stops;
          const coords =
            data.directions?.up?.stop_coordinates ||
            data.stop_coordinates ||
            [];
          if (stops && Array.isArray(stops)) {
            stops.slice(0, 10).forEach((name, idx) => {
              allStops.push({
                id: `${doc.id}-${idx}`,
                name,
                lat:
                  coords[idx]?.latitude ||
                  28.6139 + (Math.random() - 0.5) * 0.1,
                lng:
                  coords[idx]?.longitude ||
                  77.209 + (Math.random() - 0.5) * 0.1,
              });
            });
          }
        });
        setStopsToShow(allStops.slice(0, 30));
      } catch (e) {
        console.error(e);
      }
    };
    fetchStops();
  }, []);

  useEffect(() => {
    if (stopsToShow.length > 0 && mapLoaded) {
      webViewRef.current?.injectJavaScript(
        `updateStops('${JSON.stringify(stopsToShow)}');`,
      );
    }
  }, [stopsToShow, mapLoaded]);

  const renderStopItem = useCallback(
    ({ item, index }: any) => (
      <Animated.View entering={FadeInRight.delay(index * 50)}>
        <View style={styles.stopCard}>
          <View style={styles.stopDetails}>
            <Text style={styles.stopMain}>{item.name}</Text>
            <Text style={styles.stopDir}>towards Cambridge School</Text>
          </View>
          <TouchableOpacity style={styles.greenBtn}>
            <Text style={styles.greenBtnText}>View Buses</Text>
          </TouchableOpacity>
        </View>
        {index < stopsToShow.length - 1 && <View style={styles.divider} />}
      </Animated.View>
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

      <MainHeader
        style={styles.headerArea}
        showSearch={true}
        searchPlaceholder="Search 500+ Route"
        onSearchPress={() => navigation.navigate("Search")}
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>
        }
        searchRightElement={
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={28}
              color="white"
            />
            {latestNotificationTimestamp > lastSeenNotification && (
              <View style={styles.yellowDot} />
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.mapBody}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.mapWeb}
          onLoadEnd={() => setMapLoaded(true)}
        />
        <Animated.View
          style={[styles.redArrowBtn, animatedRedArrowStyle, { left: 20 }]}
        >
          <TouchableOpacity onPress={showSheet} style={styles.fabInner}>
            <MaterialCommunityIcons
              name="arrow-up-circle"
              size={40}
              color="#b92121ff"
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[styles.mapControls, animatedMapControlsStyle, { right: 20 }]}
        >
          <TouchableOpacity style={styles.controlFab}>
            <MaterialCommunityIcons name="bus" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlFab, { marginTop: 12 }]}
            onPress={centerOnUser}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={24}
              color="#000"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <EliteBottomSheet
        translateY={translateY}
        snapPoints={[SNAP_TOP, SNAP_MID, SNAP_BOTTOM]}
        sheetHeight={SHEET_FULL_HEIGHT + 50}
        headerContent={
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabBtn, styles.activeTabBtn]}>
              <Text style={styles.activeTabText}>Bus Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, styles.inactiveTabBtn]}>
              <Text style={styles.inactiveTabText}>Metro Stop</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <FlashList
          data={stopsToShow}
          renderItem={renderStopItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={70}
          scrollEnabled={canScroll}
        />
      </EliteBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerArea: {
    height: 160,
    overflow: "hidden",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
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
  redArrowBtn: { position: "absolute", zIndex: 110 },
  fabInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mapControls: { position: "absolute", zIndex: 110 },
  controlFab: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  tabBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22 },
  activeTabBtn: { backgroundColor: "#C0282C" },
  inactiveTabBtn: { backgroundColor: "#A3A3A3" },
  activeTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  inactiveTabText: { color: "white", fontWeight: "700", fontSize: 14 },
  stopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
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
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 20 },
});
