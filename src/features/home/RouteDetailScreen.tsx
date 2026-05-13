import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { ArrowLeft, Navigation, Crosshair } from "lucide-react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

// --- Interfaces ---
interface RouteData {
  routeNumber: string;
  origin: string;
  destination: string;
  totalBuses: number;
  totalStops: number;
  direction?: string;
  polylineCoordinates: { latitude: number; longitude: number }[];
  stops: string[];
}

const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// --- Modular Components ---

const RouteHeader = memo(({ 
  routeNumber, 
  busCount, 
  onBack 
}: { 
  routeNumber: string; 
  busCount: number; 
  onBack: () => void;
}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
      <ArrowLeft size={24} color="#111" />
    </TouchableOpacity>
    <Text style={styles.routeNumberTitle}>{routeNumber}</Text>
    <Text style={styles.busCountText}>{busCount} bus</Text>
  </View>
));

const RouteInfo = memo(({ origin, destination }: { origin: string; destination: string }) => (
  <View style={styles.routeInfoBox}>
    <Text style={styles.terminalText}>{origin}</Text>
    <Text style={styles.terminalText}>{destination}</Text>
  </View>
));

const FloatingButtons = memo(({ onLocate }: { onLocate: () => void }) => (
  <>
    <TouchableOpacity style={styles.floatingDirectionBtn} activeOpacity={0.8}>
      <Navigation size={22} color="#FFF" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.floatingLocateBtn} onPress={onLocate} activeOpacity={0.8}>
      <Crosshair size={22} color="#111" />
    </TouchableOpacity>
  </>
));

const StopTimelineItem = memo(({ 
  item, 
  index, 
  isLast 
}: { 
  item: string; 
  index: number; 
  isLast: boolean;
}) => (
  <View style={styles.stopRow}>
    <View style={styles.visualColumn}>
      {index === 0 ? (
        <View style={styles.solidNode} />
      ) : (
        <View style={styles.hollowNode} />
      )}
      {!isLast && <View style={styles.connector} />}
    </View>
    <View style={styles.textColumn}>
      <Text style={styles.stopName} numberOfLines={2}>
        {item}
      </Text>
    </View>
  </View>
));

// --- Main Screen ---

export const RouteDetailScreen = ({ route, navigation }: any) => {
  const { routeId } = route.params;
  
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%", "70%", "95%"], []);

  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, "routes", routeId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let formattedData: RouteData;
        
        if (data.stops && Array.isArray(data.stops)) {
          formattedData = {
            routeNumber: data.routeNumber || routeId,
            origin: data.origin || data.stops[0] || "Unknown",
            destination: data.destination || data.stops[data.stops.length - 1] || "Unknown",
            totalBuses: data.totalBuses || 11,
            totalStops: data.totalStops || data.stops.length,
            direction: data.direction,
            polylineCoordinates: data.polylineCoordinates || [],
            stops: data.stops,
          };
        } else if (data.directions) {
          const dirData = data.directions.up || data.directions.down;
          formattedData = {
            routeNumber: data.route || routeId.replace(/UP|DOWN/g, ''),
            origin: dirData?.from || dirData?.stops?.[0] || "Origin",
            destination: dirData?.to || dirData?.stops?.[dirData?.stops.length - 1] || "Destination",
            totalBuses: 11, 
            totalStops: dirData?.totalStops || dirData?.stops?.length || 0,
            direction: data.directions.up ? "UP" : "DOWN",
            polylineCoordinates: [],
            stops: dirData?.stops || [],
          };
        } else {
           formattedData = {
            routeNumber: routeId,
            origin: "Unknown",
            destination: "Unknown",
            totalBuses: 0,
            totalStops: 0,
            stops: [],
            polylineCoordinates: [],
          };
        }
        
        setRouteData(formattedData);
        setError(null);
      } else {
        setError("Route not found");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to route:", err);
      setError("Failed to load route data");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [routeId]);

  const centerMap = useCallback(() => {
    if (webViewRef.current && routeData) {
      const coords = routeData.polylineCoordinates && routeData.polylineCoordinates.length > 0 
        ? routeData.polylineCoordinates 
        : [
            { latitude: 28.6300, longitude: 77.1600 },
          ];
      if (coords.length > 0) {
        const js = `centerMap(${coords[0].latitude}, ${coords[0].longitude}); true;`;
        webViewRef.current.injectJavaScript(js);
      }
    }
  }, [routeData]);

  const mapHtml = useMemo(() => {
    if (!routeData) return '';
    const coords = routeData.polylineCoordinates.length > 0 
      ? routeData.polylineCoordinates 
      : [
          { latitude: 28.6300, longitude: 77.1600 },
          { latitude: 28.6250, longitude: 77.1650 },
          { latitude: 28.6100, longitude: 77.1800 },
          { latitude: 28.5950, longitude: 77.1900 },
          { latitude: 28.5900, longitude: 77.2000 },
          { latitude: 28.5500, longitude: 77.1950 },
          { latitude: 28.5300, longitude: 77.1900 },
        ];
    
    const latlngsStr = JSON.stringify(coords.map(c => [c.latitude, c.longitude]));
    const centerLat = coords.length > 0 ? coords[0].latitude : 28.6273;
    const centerLng = coords.length > 0 ? coords[0].longitude : 77.2183;
    const midPoint = coords.length > 0 ? coords[Math.floor(coords.length / 2)] : null;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #eef2f3; }
        .stop-marker { 
          width: 14px; 
          height: 14px; 
          background: #666666; 
          border: 2px solid white; 
          border-radius: 50%; 
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .stop-marker-inner {
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
        }
        .bus-marker {
          background: #F7931E;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1.5px solid white;
          font-size: 12px;
          font-weight: bold;
          white-space: nowrap;
          text-align: center;
          font-family: sans-serif;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${centerLat}, ${centerLng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          keepBuffer: 2
        }).addTo(map);

        var latlngs = ${latlngsStr};
        var polyline = L.polyline(latlngs, {color: '#1DA1F2', weight: 4}).addTo(map);
        
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        var stopIcon = L.divIcon({ 
          className: 'stop-icon-wrapper',
          html: '<div class="stop-marker"><div class="stop-marker-inner"></div></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        latlngs.forEach(function(ll) {
          L.marker(ll, {icon: stopIcon}).addTo(map);
        });

        ${midPoint ? `
        var busIcon = L.divIcon({
          className: 'bus-icon-wrapper',
          html: '<div class="bus-marker">🚌 ${routeData?.routeNumber || 'Bus'}</div>',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });
        L.marker([${midPoint.latitude}, ${midPoint.longitude}], {icon: busIcon}).addTo(map);
        ` : ''}

        function centerMap(lat, lng) { map.setView([lat, lng], 14); }
      </script>
    </body>
    </html>
    `;
  }, [routeData]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  if (error || !routeData) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>{error || "An error occurred"}</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
          <Text style={{color: '#FFF', fontWeight: 'bold'}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <RouteHeader 
        routeNumber={routeData.routeNumber} 
        busCount={routeData.totalBuses} 
        onBack={() => navigation.goBack()} 
      />

      <RouteInfo 
        origin={routeData.origin} 
        destination={routeData.destination} 
      />
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
        <FloatingButtons onLocate={centerMap} />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <View style={styles.sheetHeader}>
           <Text style={styles.totalStopsText}>{routeData.totalStops} stops</Text>
        </View>
        
        <BottomSheetScrollView 
          contentContainerStyle={styles.stopsListContent}
          showsVerticalScrollIndicator={false}
        >
          {routeData.stops.map((item, index) => (
            <StopTimelineItem 
              key={`${index}-${item}`}
              item={item} 
              index={index} 
              isLast={index === routeData.stops.length - 1} 
            />
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  backBtnError: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    marginRight: 16,
  },
  routeNumberTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  busCountText: {
    fontSize: 16,
    color: "#444",
    fontWeight: "400",
  },

  // Route Info
  routeInfoBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: "#FFFFFF",
  },
  terminalText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
    lineHeight: 24,
  },

  // Map Section
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  busStopMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#666666",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  busStopMarkerInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  activeBusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  
  // Floating Buttons
  floatingDirectionBtn: {
    position: "absolute",
    bottom: "38%", // Kept above the 35% bottom sheet
    left: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingLocateBtn: {
    position: "absolute",
    bottom: "38%", // Kept above the 35% bottom sheet
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#D3D3D3",
    borderRadius: 999,
    marginTop: 10,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
  },
  totalStopsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  stopsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Increased to prevent last items from hiding
  },

  // Stop Item
  stopRow: {
    flexDirection: "row",
    minHeight: 56,
  },
  visualColumn: {
    width: 30,
    alignItems: "center",
  },
  solidNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D32F2F",
    marginTop: 6,
    zIndex: 2,
  },
  hollowNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D32F2F",
    backgroundColor: "#FFFFFF",
    marginTop: 6,
    zIndex: 2,
  },
  connector: {
    position: "absolute",
    top: 20,
    width: 2,
    height: "100%",
    backgroundColor: "#D32F2F",
    zIndex: 1,
  },
  textColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "flex-start",
    paddingTop: 1,
    paddingBottom: 16,
  },
  stopName: {
    fontSize: 18,
    color: "#333",
    fontWeight: "400",
    lineHeight: 24,
  },
});
