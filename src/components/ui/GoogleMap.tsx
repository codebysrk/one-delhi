import React, { useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

export interface GoogleMapRef {
  centerMap: (lat: number, lng: number, zoom?: number) => void;
  updateUserLocation: (lat: number, lng: number) => void;
  updateNearbyStops: (stops: { lat: number; lng: number; name: string }[]) => void;
  drawRoute: (polyline: { latitude: number; longitude: number }[], routeNumber?: string) => void;
  drawEVStations: (stations: { lat: number; lng: number; name: string }[]) => void;
}

interface GoogleMapProps {
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: Location.LocationObject | null;
  onMapLoaded?: () => void;
  style?: any;
}

export const GoogleMap = forwardRef<GoogleMapRef, GoogleMapProps>(({
  initialCenter = { latitude: 30.9010, longitude: 75.8573 },
  initialZoom = 8,
  userLocation,
  onMapLoaded,
  style,
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  // Imperative handle to control Leaflet JS code via simple React ref calls
  useImperativeHandle(ref, () => ({
    centerMap: (lat: number, lng: number, zoom?: number) => {
      const js = `window.centerMap(${lat}, ${lng}, ${zoom}); true;`;
      webViewRef.current?.injectJavaScript(js);
    },
    updateUserLocation: (lat: number, lng: number) => {
      const js = `window.updateUserLocation(${lat}, ${lng}); true;`;
      webViewRef.current?.injectJavaScript(js);
    },
    updateNearbyStops: (stops) => {
      const stopsJson = JSON.stringify(stops);
      const js = `window.updateNearbyStops('${stopsJson.replace(/'/g, "\\'")}'); true;`;
      webViewRef.current?.injectJavaScript(js);
    },
    drawRoute: (polyline, routeNumber) => {
      const polylineJson = JSON.stringify(polyline);
      const js = `window.drawRoute('${polylineJson.replace(/'/g, "\\'")}', '${routeNumber || "Bus"}'); true;`;
      webViewRef.current?.injectJavaScript(js);
    },
    drawEVStations: (stations) => {
      const stationsJson = JSON.stringify(stations);
      const js = `window.drawEVStations('${stationsJson.replace(/'/g, "\\'")}'); true;`;
      webViewRef.current?.injectJavaScript(js);
    },
  }));

  // Update user location on the map whenever userLocation prop changes
  useEffect(() => {
    if (userLocation) {
      const js = `window.updateUserLocation(${userLocation.coords.latitude}, ${userLocation.coords.longitude}); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
  }, [userLocation]);

  const mapHtml = useMemo(() => {
    const centerLat = userLocation?.coords.latitude || initialCenter.latitude;
    const centerLng = userLocation?.coords.longitude || initialCenter.longitude;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f8f9fa; }
        
        /* Glowing User Blue Dot exactly like Google Maps */
        .user-marker-container {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .user-map-dot {
          position: absolute;
          width: 14px;
          height: 14px;
          background: #1a73e8; /* Google Maps blue */
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          z-index: 10;
        }

        .user-map-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(26, 115, 232, 0.25); /* Muted Google Maps light blue */
          border-radius: 50%;
          border: 1px solid rgba(26, 115, 232, 0.4);
          z-index: 5;
          animation: pulse 1.8s ease-out infinite;
          transform-origin: center;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.2);
            opacity: 0.8;
          }
          80% {
            transform: scale(1.0);
            opacity: 0;
          }
          100% {
            transform: scale(1.0);
            opacity: 0;
          }
        }
        
        /* MapScreen Stops */
        .stop-marker-nearby {
          width: 10px;
          height: 10px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
        }
        
        /* Route Detail Stops - Grey circular markers with white bus SVG */
        .stop-marker-route { 
          width: 18px; 
          height: 18px; 
          background: #7c7c7c; 
          border: 1.5px solid white; 
          border-radius: 50%; 
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        /* Bus Pill styling like Google Maps */
        .bus-pill {
          display: inline-flex;
          align-items: center;
          background: #0f9d58;
          border-radius: 4px;
          padding: 2px 5px 2px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 1px solid white;
          white-space: nowrap;
        }
        .bus-pill-icon {
          background: white;
          border-radius: 2px;
          width: 14px;
          height: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 4px;
        }
        .bus-pill-text {
          color: white;
          font-size: 11px;
          font-weight: 800;
          font-family: sans-serif;
          line-height: 1;
        }
        
        /* EV Charger Pins */
        .ev-marker { 
          width: 32px; height: 32px; background: #10B981; 
          border: 2.5px solid white; border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex; justify-content: center; align-items: center;
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
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${centerLat}, ${centerLng}], ${initialZoom});
        
        // Unified premium Google Maps tilelayer with HD scale=2 support
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2', {
          maxZoom: 20,
        }).addTo(map);

        var userMarker = null;
        var stopMarkers = L.layerGroup().addTo(map);
        var routeMarkers = L.layerGroup().addTo(map);
        var evMarkers = L.layerGroup().addTo(map);
        var busMarker = null;
        var polyline = null;

        // Initialize User Location if provided initially
        ${userLocation ? `
          userMarker = L.marker([${userLocation.coords.latitude}, ${userLocation.coords.longitude}], {
            icon: L.divIcon({ 
              className: '', 
              html: '<div class="user-marker-container"><div class="user-map-dot"></div><div class="user-map-pulse"></div></div>', 
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })
          }).addTo(map);
        ` : ""}

        // Helper 1: Center Map
        window.centerMap = function(lat, lng, zoom) {
          map.flyTo([lat, lng], zoom || 15, { duration: 0.8 });
        };

        // Helper 2: Update/Draw User Location Blue Dot
        window.updateUserLocation = function(lat, lng) {
          var latlng = [lat, lng];
          if (userMarker) {
            var curr = userMarker.getLatLng();
            // ONLY update position if coordinates actually changed to prevent CSS animation reset/flicker
            if (curr.lat !== lat || curr.lng !== lng) {
              userMarker.setLatLng(latlng);
            }
          } else {
            userMarker = L.marker(latlng, {
              icon: L.divIcon({ 
                className: '', 
                html: '<div class="user-marker-container"><div class="user-map-dot"></div><div class="user-map-pulse"></div></div>', 
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })
            }).addTo(map);
          }
        };

        // Helper 3: Draw Nearby Stops (MapScreen)
        var nearbyStopIcon = L.divIcon({ className: '', html: '<div class="stop-marker-nearby"></div>', iconSize: [12, 12] });
        window.updateNearbyStops = function(stopsJson) {
          stopMarkers.clearLayers();
          var stops = JSON.parse(stopsJson);
          stops.forEach(function(s) {
            L.marker([s.lat, s.lng], { icon: nearbyStopIcon }).bindPopup(s.name).addTo(stopMarkers);
          });
        };

        // Helper 4: Draw Polyline Route and Bus Icon (RouteDetailScreen)
        var routeStopIcon = L.divIcon({ 
          className: 'stop-icon-wrapper',
          html: '<div class="stop-marker-route"><svg viewBox="0 0 24 24" width="11" height="11" fill="white"><path d="M18 11H6V6h12v5zm-1.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM7.5 16.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM20 10V6c0-2.21-1.79-4-4-4H8C5.79 2 4 3.79 4 6v4c0 .55.45 1 1 1v5c0 1.66 1.34 3 3 3l-1.5 1.5v.5c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h6v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-.5L16 18c1.66 0 3-1.34 3-3v-5c.55 0 1-.45 1-1z"/></svg></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        window.drawRoute = function(polylineJson, routeNumber) {
          routeMarkers.clearLayers();
          if (polyline) { map.removeLayer(polyline); }
          if (busMarker) { map.removeLayer(busMarker); busMarker = null; }

          var coords = JSON.parse(polylineJson);
          if (coords.length === 0) return;

          var latlngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
          polyline = L.polyline(latlngs, {color: '#1DA1F2', weight: 4}).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

          latlngs.forEach(function(ll) {
            L.marker(ll, {icon: routeStopIcon}).addTo(routeMarkers);
          });

          var midIdx = Math.floor(latlngs.length / 2);
          var mid = latlngs[midIdx];
          var busIcon = L.divIcon({
            className: 'bus-icon-wrapper',
            html: '<div class="bus-pill"><div class="bus-pill-icon"><svg viewBox="0 0 24 24" width="10" height="10" fill="#0f9d58"><path d="M18 11H6V6h12v5zm-1.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM7.5 16.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM20 10V6c0-2.21-1.79-4-4-4H8C5.79 2 4 3.79 4 6v4c0 .55.45 1 1 1v5c0 1.66 1.34 3 3 3l-1.5 1.5v.5c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h6v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-.5L16 18c1.66 0 3-1.34 3-3v-5c.55 0 1-.45 1-1z"/></svg></div><span class="bus-pill-text">' + (routeNumber || 'Bus') + '</span></div>',
            iconSize: [60, 24],
            iconAnchor: [30, 12]
          });
          busMarker = L.marker(mid, {icon: busIcon}).addTo(map);
        };

        // Helper 5: Draw EV Station Pins (EVScreen)
        var evIcon = L.divIcon({
          className: '',
          html: '<div class="ev-marker"><i>⚡</i></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        window.drawEVStations = function(stationsJson) {
          evMarkers.clearLayers();
          var stations = JSON.parse(stationsJson);
          stations.forEach(function(s) {
            L.marker([s.lat, s.lng], { icon: evIcon }).addTo(evMarkers);
          });
        };
      </script>
    </body>
    </html>
    `;
  }, []); // Only compile HTML once to keep WebView fast and smooth

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webView}
        onLoad={onMapLoaded}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
