import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, useWindowDimensions, Alert, StatusBar, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { GoogleMap, GoogleMapRef } from "../../components/ui/GoogleMap";
import { FlashList } from "@shopify/flash-list";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolate, useAnimatedReaction, runOnJS, FadeInRight } from "react-native-reanimated";
import { useAppStore } from "../../store/useAppStore";
import { BottomSheet } from "../../components/layout/BottomSheet";
import { MainHeader } from "../../components/layout/Header";
import { ANIMATIONS, COLORS } from "../../theme/theme";
import { getStops } from "../../services/routeService";
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
};
const SHEET_MIN_HEIGHT = 180;
export const MapScreen = ({
  navigation
}: any) => {
  const insets = useSafeAreaInsets();
  const {
    height: SCREEN_HEIGHT
  } = useWindowDimensions();
  const SHEET_FULL_HEIGHT = SCREEN_HEIGHT * 0.85;
  const SHEET_HALF_HEIGHT = SHEET_FULL_HEIGHT * 0.62;
  const sheetHeight = SCREEN_HEIGHT * 0.95;
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight || 24 : insets.top || 44;
  const SNAP_TOP = statusBarHeight - 6;
  const SNAP_MID = SHEET_FULL_HEIGHT - SHEET_HALF_HEIGHT + 250;
  const SNAP_BOTTOM = SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT + 250;
  const webViewRef = useRef<GoogleMapRef>(null);
  const hasAnimatedOnLoad = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [stopsToShow, setStopsToShow] = useState<any[]>([]);
  const [dbStops, setDbStops] = useState<{
    id: string;
    name: string;
  }[]>([]);
  const translateY = useSharedValue(SNAP_MID);
  const [canScroll, setCanScroll] = useState(false);
  const {
    setShowFooter,
    lastSeenNotification,
    latestNotificationTimestamp
  } = useAppStore();
  useEffect(() => {
    setShowFooter(true);
  }, []);
  useAnimatedReaction(() => translateY.value, val => {
    if (val <= SNAP_TOP + 5) {
      if (!canScroll) runOnJS(setCanScroll)(true);
    } else {
      if (canScroll) runOnJS(setCanScroll)(false);
    }
  }, [canScroll, SNAP_TOP]);
  useEffect(() => {
    if (location && mapLoaded && !hasAnimatedOnLoad.current) {
      hasAnimatedOnLoad.current = true;
      const timer = setTimeout(() => {
        webViewRef.current?.triggerFocusAnimation(location.coords.latitude, location.coords.longitude, 15);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location, mapLoaded]);
  useFocusEffect(useCallback(() => {
    translateY.value = withSpring(SNAP_MID, ANIMATIONS.fastSpring);
    if (location && mapLoaded) {
      if (!hasAnimatedOnLoad.current) {
        return;
      }
      const timer = setTimeout(() => {
        webViewRef.current?.triggerFocusAnimation(location.coords.latitude, location.coords.longitude, 15);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [SNAP_MID, location, mapLoaded]));
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        let {
          status
        } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "One Delhi needs location access to show you nearby stops.");
          return;
        }
        let cachedLoc = await Location.getLastKnownPositionAsync();
        if (cachedLoc) {
          setLocation(cachedLoc);
        }
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setLocation(loc);
      } catch (error) {
        console.log("Location fetch error:", error);
      }
    };
    initializeLocation();
  }, []);
  const centerOnUser = () => {
    if (location) {
      webViewRef.current?.centerMap(location.coords.latitude, location.coords.longitude, 15);
    }
  };
  const showSheet = () => {
    translateY.value = withSpring(SNAP_MID, ANIMATIONS.fastSpring);
  };
  const animatedRedArrowStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, SHEET_FULL_HEIGHT + 35 - translateY.value);
    const opacity = interpolate(translateY.value, [SNAP_MID, SNAP_BOTTOM], [0, 1], Extrapolate.CLAMP);
    return {
      bottom: visibleHeight + 8,
      zIndex: 110,
      opacity: opacity,
      transform: [{
        scale: opacity
      }]
    };
  });
  const animatedMapControlsStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, SCREEN_HEIGHT - translateY.value);
    const opacity = interpolate(translateY.value, [SNAP_TOP, SNAP_MID], [0, 1], Extrapolate.CLAMP);
    const extraOffset = interpolate(translateY.value, [SNAP_MID, SNAP_BOTTOM], [-35, 5], Extrapolate.CLAMP);
    return {
      bottom: visibleHeight + extraOffset,
      zIndex: 110,
      opacity: opacity,
      transform: [{
        scale: opacity
      }]
    };
  });
  useEffect(() => {
    if (!location) return;
    const loadStops = async () => {
      const rawStops: any[] = require("../../../assets/stops.json");
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      const sortedStops = rawStops.map(stop => ({
        id: stop.stop_id,
        name: stop.stop_name,
        lat: stop.stop_lat,
        lng: stop.stop_lon,
        distance: getDistance(lat, lng, stop.stop_lat, stop.stop_lon)
      })).sort((a, b) => a.distance - b.distance);
      const seenNames = new Set<string>();
      const uniqueSortedStops: any[] = [];
      for (let i = 0; i < sortedStops.length; i++) {
        const stop = sortedStops[i];
        const cleanName = stop.name.toLowerCase().trim();
        if (!seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          uniqueSortedStops.push(stop);
          if (uniqueSortedStops.length === 5) {
            break;
          }
        }
      }
      setStopsToShow(uniqueSortedStops);
    };
    loadStops();
  }, [location]);
  useEffect(() => {
    const fetchAndDrawDbStops = async () => {
      if (!mapLoaded) return;
      try {
        const list = await getStops();
        const stopsData = list.map(item => {
          return {
            id: item.id,
            name: item.name || "",
            stop_id: item.id || "",
            lat: item.lat,
            lng: item.lng
          };
        });
        setDbStops(stopsData);
        const rawStops: any[] = require("../../../assets/stops.json");
        const stopsToDraw: {
          lat: number;
          lng: number;
          name: string;
        }[] = [];
        const seenNames = new Set<string>();
        const seenCoords = new Set<string>();
        stopsData.forEach(dbStop => {
          let lat: number | undefined;
          let lng: number | undefined;
          let name = dbStop.name;
          if (dbStop.lat && dbStop.lng) {
            lat = Number(dbStop.lat);
            lng = Number(dbStop.lng);
          } else {
            let matched = rawStops.find(s => dbStop.stop_id && s.stop_id === dbStop.stop_id || dbStop.name && s.stop_name.toLowerCase().trim() === dbStop.name.toLowerCase().trim());
            if (!matched && dbStop.name) {
              matched = rawStops.find(s => s.stop_name.toLowerCase().includes(dbStop.name.toLowerCase().trim()) || dbStop.name.toLowerCase().trim().includes(s.stop_name.toLowerCase()));
            }
            if (matched) {
              lat = matched.stop_lat;
              lng = matched.stop_lon;
              name = dbStop.name || matched.stop_name;
            }
          }
          if (lat !== undefined && lng !== undefined && name) {
            const nameKey = name.toLowerCase().trim();
            const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            if (!seenNames.has(nameKey) && !seenCoords.has(coordKey)) {
              seenNames.add(nameKey);
              seenCoords.add(coordKey);
              stopsToDraw.push({
                lat,
                lng,
                name
              });
            }
          }
        });
        if (stopsToDraw.length > 0) {
          webViewRef.current?.updateNearbyStops(stopsToDraw);
        }
      } catch (error) {
        console.error("Error fetching or mapping db stops:", error);
      }
    };
    fetchAndDrawDbStops();
  }, [mapLoaded]);
  const renderStopItem = useCallback(({
    item,
    index
  }: any) => <Animated.View entering={FadeInRight.delay(index * 50)}>
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
      </Animated.View>, [stopsToShow.length]);
  return <Screen noPadding ignoreTopSafe style={styles.container}>
      <MainHeader style={styles.headerArea} showSearch={true} searchPlaceholder="Search 500+ Route" onSearchPress={() => navigation.navigate("Search")} rightElement={<TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", {
      screen: "Settings"
    })}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>} searchRightElement={<TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate("Notifications")}>
            <MaterialCommunityIcons name="bell-outline" size={28} color="white" />
            {latestNotificationTimestamp > lastSeenNotification && <View style={styles.yellowDot} />}
          </TouchableOpacity>} />

      <View style={styles.mapBody}>
        <GoogleMap ref={webViewRef} userLocation={location} onMapLoaded={() => setMapLoaded(true)} style={styles.mapWeb} animateOnLoad={true} />
        <Animated.View style={[styles.redArrowBtn, animatedRedArrowStyle, {
        left: 20
      }]}>
          <TouchableOpacity onPress={showSheet} style={styles.fabInner}>
            <MaterialCommunityIcons name="arrow-up-circle" size={40} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.mapControls, animatedMapControlsStyle, {
        right: 20
      }]}>
          <TouchableOpacity style={styles.controlFab}>
            <MaterialCommunityIcons name="bus" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlFab, {
          marginTop: 12
        }]} onPress={centerOnUser}>
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <BottomSheet translateY={translateY} snapPoints={[SNAP_TOP, SNAP_MID, SNAP_BOTTOM]} sheetHeight={sheetHeight} headerContent={<View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabBtn, styles.activeTabBtn]}>
              <Text style={styles.activeTabText}>Bus Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, styles.inactiveTabBtn]}>
              <Text style={styles.inactiveTabText}>Metro Stop</Text>
            </TouchableOpacity>
          </View>}>
        <FlashList data={stopsToShow} renderItem={renderStopItem} keyExtractor={item => item.id} estimatedItemSize={58} scrollEnabled={canScroll} contentContainerStyle={{
        paddingBottom: insets.bottom + 40
      }} />
      </BottomSheet>
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  headerArea: {
    overflow: "hidden",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40
  },
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  yellowDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.white
  },
  mapBody: {
    flex: 1,
    marginTop: -28,
    zIndex: -1
  },
  mapWeb: {
    flex: 1
  },
  redArrowBtn: {
    position: "absolute",
    zIndex: 110
  },
  fabInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  mapControls: {
    position: "absolute",
    zIndex: 110
  },
  controlFab: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6
  },
  tabBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
    paddingHorizontal: 0
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary
  },
  inactiveTabBtn: {
    backgroundColor: COLORS.textMuted
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14
  },
  inactiveTabText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14
  },
  stopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  stopDetails: {
    flex: 1
  },
  stopMain: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black
  },
  stopDir: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1.5
  },
  greenBtn: {
    borderWidth: 1.1,
    borderColor: COLORS.success,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15
  },
  greenBtnText: {
    color: COLORS.success,
    fontWeight: "700",
    fontSize: 11.5
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20
  }
});