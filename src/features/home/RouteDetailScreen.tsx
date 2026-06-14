import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../components/layout/Screen";
import { Header } from "../../components/layout/Header";
import { GoogleMap, GoogleMapRef } from "../../components/ui/GoogleMap";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../../services/firebase";
import * as Location from "expo-location";
import { BottomSheet } from "../../components/layout/BottomSheet";
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolate, withSpring, FadeInDown } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { COLORS, ANIMATIONS } from "../../theme/theme";
let _stopsCache: any[] | null = null;
const getStopsData = async (): Promise<any[]> => {
  if (_stopsCache) return _stopsCache;
  _stopsCache = require("../../../assets/stops.json") as any[];
  return _stopsCache;
};
const findCoordinatesForStops = async (stopNames: string[]): Promise<{
  latitude: number;
  longitude: number;
}[]> => {
  const rawStops = await getStopsData();
  const coords: {
    latitude: number;
    longitude: number;
  }[] = [];
  let lastValid = {
    latitude: 28.6139,
    longitude: 77.2090
  };
  let hasValidAnchor = false;
  const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dy = lat1 - lat2;
    const dx = lon1 - lon2;
    return Math.sqrt(dy * dy + dx * dx);
  };
  const MAX_DEGREE_JUMP = 0.035;
  for (let i = 0; i < stopNames.length; i++) {
    const name = stopNames[i];
    const exactMatches = rawStops.filter(s => s.stop_name.toLowerCase().trim() === name.toLowerCase().trim());
    let bestMatch: any = null;
    if (exactMatches.length > 0) {
      if (hasValidAnchor) {
        let minDist = Infinity;
        exactMatches.forEach(match => {
          const d = getDist(lastValid.latitude, lastValid.longitude, match.stop_lat, match.stop_lon);
          if (d < minDist) {
            minDist = d;
            bestMatch = match;
          }
        });
        if (minDist > MAX_DEGREE_JUMP) {
          bestMatch = null;
        }
      } else {
        bestMatch = exactMatches[0];
      }
    }
    if (!bestMatch) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      const tokens = cleanName.split(/\s+/).filter(t => t.length > 2);
      let maxOverlap = 0;
      let minDist = Infinity;
      if (tokens.length > 0) {
        for (let j = 0; j < rawStops.length; j++) {
          const stop = rawStops[j];
          if (hasValidAnchor) {
            const d = getDist(lastValid.latitude, lastValid.longitude, stop.stop_lat, stop.stop_lon);
            if (d > MAX_DEGREE_JUMP) continue;
          }
          const sClean = stop.stop_name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
          let overlap = 0;
          for (let k = 0; k < tokens.length; k++) {
            if (sClean.includes(tokens[k])) {
              overlap++;
            }
          }
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = stop;
            if (hasValidAnchor) {
              minDist = getDist(lastValid.latitude, lastValid.longitude, stop.stop_lat, stop.stop_lon);
            }
          } else if (overlap === maxOverlap && overlap > 0 && hasValidAnchor) {
            const d = getDist(lastValid.latitude, lastValid.longitude, stop.stop_lat, stop.stop_lon);
            if (d < minDist) {
              minDist = d;
              bestMatch = stop;
            }
          }
        }
      }
    }
    if (bestMatch) {
      const coord = {
        latitude: bestMatch.stop_lat,
        longitude: bestMatch.stop_lon
      };
      coords.push(coord);
      lastValid = coord;
      hasValidAnchor = true;
    } else {
      coords.push({
        latitude: 0,
        longitude: 0
      });
    }
  }
  let firstValidIdx = -1;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i].latitude !== 0) {
      firstValidIdx = i;
      break;
    }
  }
  if (firstValidIdx === -1) {
    return stopNames.map((_, idx) => ({
      latitude: 28.6139 + idx * 0.001,
      longitude: 77.2090 + idx * 0.001
    }));
  }
  const firstValid = coords[firstValidIdx];
  for (let i = 0; i < firstValidIdx; i++) {
    coords[i] = {
      ...firstValid
    };
  }
  lastValid = firstValid;
  for (let i = firstValidIdx + 1; i < coords.length; i++) {
    if (coords[i].latitude === 0) {
      let nextValid = lastValid;
      let steps = 1;
      for (let j = i + 1; j < coords.length; j++) {
        if (coords[j].latitude !== 0) {
          nextValid = coords[j];
          steps = j - i + 1;
          break;
        }
      }
      const t = 1 / steps;
      coords[i] = {
        latitude: lastValid.latitude + (nextValid.latitude - lastValid.latitude) * t,
        longitude: lastValid.longitude + (nextValid.longitude - lastValid.longitude) * t
      };
    }
    lastValid = coords[i];
  }
  return coords;
};
interface RouteData {
  routeNumber: string;
  origin: string;
  destination: string;
  totalBuses: number;
  totalStops: number;
  direction?: string;
  polylineCoordinates: {
    latitude: number;
    longitude: number;
  }[];
  stops: string[];
}
const RouteInfo = memo(({
  origin,
  destination
}: {
  origin: string;
  destination: string;
}) => <View style={styles.routeInfoBox}>
    <Text style={styles.terminalText}>{origin}</Text>
    <Text style={styles.terminalText}>{destination}</Text>
  </View>);
const StopTimelineItem = memo(({
  item,
  index,
  isLast
}: {
  item: string;
  index: number;
  isLast: boolean;
}) => <Animated.View entering={FadeInDown.delay(index * 30).duration(ANIMATIONS.fastTiming.duration)} style={styles.stopRow}>
    <View style={styles.visualColumn}>
      {!isLast && <View style={styles.connector} />}
      {index === 0 || isLast ? <View style={styles.solidNode} /> : <View style={styles.hollowNode} />}
    </View>
    <View style={styles.textColumn}>
      <Text style={styles.stopName} numberOfLines={1} ellipsizeMode="tail">
        {item}
      </Text>
    </View>
  </Animated.View>);
export const RouteDetailScreen = ({
  route,
  navigation
}: any) => {
  const {
    routeId,
    direction
  } = route.params || {};
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<Location.LocationObject | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const webViewRef = useRef<GoogleMapRef>(null);
  const {
    height: SCREEN_HEIGHT
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const SHEET_MIN_HEIGHT = 240;
  const SHEET_FULL_HEIGHT = SCREEN_HEIGHT * 0.98;
  const SHEET_HALF_HEIGHT = SHEET_FULL_HEIGHT * 0.79;
  const sheetHeight = SCREEN_HEIGHT * 1;
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top || 44;
  const SNAP_TOP = statusBarHeight - 48 - SCREEN_HEIGHT + sheetHeight;
  const SNAP_MID = SHEET_FULL_HEIGHT - SHEET_HALF_HEIGHT + 360;
  const SNAP_BOTTOM = SHEET_FULL_HEIGHT - SHEET_MIN_HEIGHT + 350;
  const snapPoints = useMemo(() => [SNAP_TOP, SNAP_MID, SNAP_BOTTOM], [SNAP_TOP, SNAP_MID, SNAP_BOTTOM]);
  const translateY = useSharedValue(SNAP_MID);
  const [canScroll, setCanScroll] = useState(false);
  useAnimatedReaction(() => translateY.value, val => {
    if (val <= SNAP_TOP + 5) {
      if (!canScroll) runOnJS(setCanScroll)(true);
    } else {
      if (canScroll) runOnJS(setCanScroll)(false);
    }
  }, [canScroll, SNAP_TOP]);
  const scrollY = useSharedValue(0);
  const onScroll = useCallback((event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);
  const showSheet = () => {
    translateY.value = withSpring(SNAP_MID, ANIMATIONS.fastSpring);
  };
  useFocusEffect(useCallback(() => {
    translateY.value = withSpring(SNAP_MID, ANIMATIONS.fastSpring);
  }, [SNAP_MID]));
  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection("routes").doc(routeId).onSnapshot(async docSnap => {
      if (docSnap && docSnap.exists) {
        const data = docSnap.data();
        let formattedData: RouteData;
        if (data.stops && Array.isArray(data.stops)) {
          const rawStops = Array.from(new Set(data.stops.map((s: string) => s.trim()).filter(Boolean))) as string[];
          const coords = data.polylineCoordinates && data.polylineCoordinates.length > 0 ? data.polylineCoordinates : await findCoordinatesForStops(rawStops);
          formattedData = {
            routeNumber: data.routeNumber || routeId,
            origin: data.origin || rawStops[0] || "Unknown",
            destination: data.destination || rawStops[rawStops.length - 1] || "Unknown",
            totalBuses: data.totalBuses || 11,
            totalStops: rawStops.length,
            direction: data.direction,
            polylineCoordinates: coords,
            stops: rawStops
          };
        } else if (data.directions) {
          const hasUp = !!(data.directions.up && Array.isArray(data.directions.up.stops) && data.directions.up.stops.length > 0);
          const hasDown = !!(data.directions.down && Array.isArray(data.directions.down.stops) && data.directions.down.stops.length > 0);
          let activeDirection = direction || (hasUp ? "UP" : "DOWN");
          if (activeDirection === "UP" && !hasUp) {
            activeDirection = "DOWN";
          } else if (activeDirection === "DOWN" && !hasDown) {
            activeDirection = "UP";
          }
          const dirData = activeDirection === "UP" ? data.directions.up : data.directions.down;
          const stopNames = Array.from(new Set((dirData?.stops || []).map((s: string) => s.trim()).filter(Boolean))) as string[];
          const coords = dirData?.stop_coordinates && dirData.stop_coordinates.length > 0 ? dirData.stop_coordinates : await findCoordinatesForStops(stopNames);
          formattedData = {
            routeNumber: data.route || routeId.replace(/UP|DOWN/g, ''),
            origin: dirData?.from || stopNames[0] || "Origin",
            destination: dirData?.to || stopNames[stopNames.length - 1] || "Destination",
            totalBuses: 11,
            totalStops: stopNames.length,
            direction: activeDirection,
            polylineCoordinates: coords,
            stops: stopNames
          };
        } else {
          formattedData = {
            routeNumber: routeId,
            origin: "Unknown",
            destination: "Unknown",
            totalBuses: 0,
            totalStops: 0,
            stops: [],
            polylineCoordinates: []
          };
        }
        setRouteData(formattedData);
        setError(null);
      } else {
        setError("Route not found");
      }
      setLoading(false);
    }, err => {
      console.error("Error listening to route:", err);
      setError("Failed to load route data");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [routeId]);
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        let {
          status
        } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          setUserLoc(loc);
        }
      } catch (error) {
        console.log("Error getting user location in RouteDetailScreen:", error);
      }
    };
    getUserLocation();
  }, []);
  const centerMap = useCallback(() => {
    if (webViewRef.current) {
      if (userLoc) {
        webViewRef.current.centerMap(userLoc.coords.latitude, userLoc.coords.longitude, 16);
      } else if (routeData && routeData.polylineCoordinates.length > 0) {
        const firstStop = routeData.polylineCoordinates[0];
        webViewRef.current.centerMap(firstStop.latitude, firstStop.longitude, 14);
      }
    }
  }, [userLoc, routeData]);
  useEffect(() => {
    if (mapLoaded && routeData && routeData.polylineCoordinates.length > 0) {
      webViewRef.current?.drawRoute(routeData.polylineCoordinates, routeData.routeNumber);
    }
  }, [routeData, mapLoaded]);
  const animatedControlStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, SCREEN_HEIGHT - translateY.value);
    const opacity = interpolate(translateY.value, [SNAP_TOP, SNAP_MID], [0, 1], Extrapolate.CLAMP);
    const extraOffset = interpolate(translateY.value, [SNAP_MID, SNAP_BOTTOM], [5, 20], Extrapolate.CLAMP);
    return {
      bottom: visibleHeight + extraOffset,
      opacity: opacity,
      transform: [{
        scale: opacity
      }]
    };
  });
  const animatedRedArrowStyle = useAnimatedStyle(() => {
    const visibleHeight = Math.max(0, SCREEN_HEIGHT - translateY.value);
    const opacity = interpolate(translateY.value, [SNAP_MID, SNAP_BOTTOM], [0, 1], Extrapolate.CLAMP);
    return {
      bottom: visibleHeight + 10,
      opacity: opacity,
      transform: [{
        scale: opacity
      }]
    };
  });
  if (loading) {
    return <Screen noPadding ignoreTopSafe style={StyleSheet.flatten([styles.centerBox, {
      backgroundColor: '#F8F9FA'
    }])}>
        {}
        <Header title="Loading..." onBackPress={() => navigation.goBack()} backgroundColor="#FFFFFF" textColor="#000000" height={50} titleStyle={{
        fontSize: 18
      }} />
        {}
        <View style={{
        padding: 20
      }}>
          {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonNode} />
              <View style={styles.skeletonBarLong} />
            </View>)}
        </View>
      </Screen>;
  }
  if (error || !routeData) {
    return <Screen noPadding ignoreTopSafe style={styles.centerBox}>
        <Header title="Error" onBackPress={() => navigation.goBack()} backgroundColor="#FFFFFF" textColor="#000000" height={50} titleStyle={{
        fontSize: 18
      }} />
        <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20
      }}>
          <Text style={styles.errorText}>{error || "An error occurred"}</Text>
          <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
            <Text style={{
            color: '#FFF',
            fontWeight: 'bold'
          }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>;
  }
  return <Screen noPadding ignoreTopSafe style={{
    backgroundColor: '#FFFFFF'
  }}>
      <Header title={routeData.routeNumber} onBackPress={() => navigation.goBack()} backgroundColor="#FFFFFF" textColor="#000000" height={50} titleStyle={{
      fontSize: 18
    }} rightElement={<Text style={{
      color: "#333",
      fontSize: 16,
      fontWeight: "600"
    }}>
            {routeData.totalBuses} bus
          </Text>} />

      <RouteInfo origin={routeData.origin} destination={routeData.destination} />
      <View style={styles.mapContainer}>
        <GoogleMap ref={webViewRef} userLocation={userLoc} onMapLoaded={() => setMapLoaded(true)} style={styles.map} />
        
        <Animated.View style={[styles.floatingDirectionBtn, animatedRedArrowStyle, {
        left: 20
      }]}>
          <TouchableOpacity onPress={showSheet} activeOpacity={0.8} style={styles.fabInner}>
            <MaterialCommunityIcons name="arrow-up-circle" size={40} color="#b92121ff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.floatingLocateBtn, animatedControlStyle, {
        right: 20
      }]}>
          <TouchableOpacity onPress={centerMap} activeOpacity={0.8} style={styles.fabInner}>
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#111" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <BottomSheet translateY={translateY} snapPoints={snapPoints} sheetHeight={sheetHeight} headerContent={<View style={styles.sheetHeader}>
            <Text style={styles.totalStopsText}>{routeData.totalStops} stops</Text>
          </View>}>
        <FlashList data={routeData.stops} renderItem={({
        item,
        index
      }) => <StopTimelineItem item={item} index={index} isLast={index === routeData.stops.length - 1} />} keyExtractor={(item, index) => `${index}-${item}`} estimatedItemSize={60} contentContainerStyle={styles.stopsListContent} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={canScroll} />
      </BottomSheet>
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  centerBox: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    backgroundColor: "#FFF"
  },
  skeletonHeader: {
    height: 100,
    backgroundColor: '#FFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginTop: 40
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB'
  },
  skeletonBarShort: {
    width: 120,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
    borderRadius: 4
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30
  },
  skeletonNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB'
  },
  skeletonBarLong: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
    borderRadius: 4
  },
  errorText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20
  },
  backBtnError: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  routeInfoBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: "#FFFFFF"
  },
  terminalText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
    lineHeight: 24
  },
  mapContainer: {
    flex: 1,
    position: "relative"
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  busStopMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#666666",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  busStopMarkerInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF"
  },
  activeBusMarker: {
    backgroundColor: "#F7931E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  activeBusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  },
  floatingDirectionBtn: {
    position: "absolute",
    zIndex: 110
  },
  floatingLocateBtn: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  fabInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  handleIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#D3D3D3",
    borderRadius: 999,
    marginTop: 10
  },
  sheetHeader: {
    paddingHorizontal: 0,
    paddingBottom: 8,
    paddingTop: 4
  },
  totalStopsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111"
  },
  stopsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 5
  },
  stopRow: {
    flexDirection: "row",
    minHeight: 34
  },
  visualColumn: {
    width: 20,
    alignItems: "center",
    marginLeft: -3
  },
  solidNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginTop: 3,
    zIndex: 2
  },
  hollowNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#FFFFFF",
    marginTop: 3,
    zIndex: 2
  },
  connector: {
    position: "absolute",
    top: 17,
    bottom: -8,
    width: 2,
    backgroundColor: COLORS.primary,
    zIndex: 1
  },
  textColumn: {
    flex: 1,
    marginLeft: 8,
    justifyContent: "flex-start",
    paddingTop: 1,
    paddingBottom: 4
  },
  stopName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
    lineHeight: 20
  }
});