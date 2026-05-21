import React, { useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { LEAFLET_CSS, LEAFLET_JS } from "./leafletAssets";

export interface GoogleMapRef {
  centerMap: (lat: number, lng: number, zoom?: number) => void;
  updateUserLocation: (lat: number, lng: number) => void;
  updateNearbyStops: (stops: { lat: number; lng: number; name: string }[]) => void;
  drawRoute: (polyline: { latitude: number; longitude: number }[], routeNumber?: string) => void;
  drawEVStations: (stations: { lat: number; lng: number; name: string }[]) => void;
  triggerFocusAnimation: (lat: number, lng: number, zoom?: number) => void;
}

interface GoogleMapProps {
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: Location.LocationObject | null;
  onMapLoaded?: () => void;
  style?: any;
  animateOnLoad?: boolean;
}

export const GoogleMap = forwardRef<GoogleMapRef, GoogleMapProps>(({
  initialCenter = { latitude: 30.9010, longitude: 75.8573 },
  initialZoom = 8,
  userLocation,
  onMapLoaded,
  style,
  animateOnLoad = false,
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
    triggerFocusAnimation: (lat: number, lng: number, zoom?: number) => {
      const js = `window.triggerFocusAnimation(${lat}, ${lng}, ${zoom || 15}); true;`;
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
    const mapStartLat = animateOnLoad ? 54.5260 : centerLat;
    const mapStartLng = animateOnLoad ? 15.2551 : centerLng;
    const mapStartZoom = animateOnLoad ? 6 : (userLocation ? 15 : initialZoom);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>${LEAFLET_CSS}</style>
      <script>${LEAFLET_JS}</script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #f8f9fa; }
        
        /* Optimize rendering quality and text clarity */
        .leaflet-tile {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        .leaflet-container {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Glowing User Blue Dot */
        .user-marker {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
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
        // Error handling & logging back to React Native
        window.onerror = function(message, source, lineno, colno, error) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: message + ' at ' + source + ':' + lineno + ':' + colno
            }));
          }
          return true;
        };
        
        window.log = function(msg) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'log',
              message: msg
            }));
          }
        };

        window.log("HTML scripts started initializing...");

        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${mapStartLat}, ${mapStartLng}], ${mapStartZoom});
        
        // Detect device pixel ratio to dynamically select Google Maps tile scale (1x, 2x, 3x, 4x)
        // This ensures pixel-perfect sharpness on high-density Retina/DPI screens.
        var pr = window.devicePixelRatio || 1;
        var mapScale = 2; // Default to 2x (Retina)
        if (pr > 3) {
          mapScale = 4;
        } else if (pr > 2) {
          mapScale = 3;
        } else if (pr > 1) {
          mapScale = 2;
        } else {
          mapScale = 1;
        }

        window.log("Device Pixel Ratio: " + pr + " -> Chosen Map Scale: " + mapScale);

        // Unified premium Google Maps tilelayer with dynamic HD scale support
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=' + mapScale, {
          maxZoom: 20,
          tileSize: 256, // Leaflet tile size in CSS pixels
        }).addTo(map);

        window.log("Map object created successfully.");

        var userMarker = null;
        var stopMarkers = L.layerGroup().addTo(map);
        var routeMarkers = L.layerGroup().addTo(map);
        var evMarkers = L.layerGroup().addTo(map);
        var busMarker = null;
        var polyline = null;

        // Initialize User Location if provided initially
        ${userLocation ? `
          userMarker = L.marker([${userLocation.coords.latitude}, ${userLocation.coords.longitude}], {
            icon: L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [10, 10] })
          }).addTo(map);

          if (${animateOnLoad}) {
            setTimeout(function() {
              window.log("Running onload flyTo from Europe...");
              map.flyTo([${userLocation.coords.latitude}, ${userLocation.coords.longitude}], 15, { duration: 0.8, easeLinearity: 1 });
            }, 300);
          }
        ` : ""}

        // Helper: Trigger Flying/Panning Focus Animation
        window.triggerFocusAnimation = function(lat, lng, zoom) {
          var targetZoom = zoom || 15;
          window.log("triggerFocusAnimation called for: " + lat + ", " + lng);
          // तुरंत बिना एनीमेशन के यूरोप (lat: 54.5260, lng: 15.2551) पर ज़ूम 0 सेट करें
          map.setView([54.5260, 15.2551], 0, { animate: false });
          
          // 150ms बाद सुचारू रूप से फ़्लाई-इन (flyTo) करें
          setTimeout(function() {
            window.log("flyTo animating from Europe to user location...");
            map.flyTo([lat, lng], targetZoom, { duration: 0.5, easeLinearity: 0.25 });
          }, 150);
        };

        // Notify React Native that map is ready
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
          window.log("Sent MAP_READY to React Native.");
        }

        // Helper 1: Center Map (With premium distance-aware transitions to completely prevent Leaflet's shaking/vibration bug)
        window.centerMap = function(lat, lng, zoom) {
          var targetZoom = zoom || 15;
          var currentCenter = map.getCenter();
          var currentZoom = map.getZoom();
          
          // Leaflet built-in utility to compute real-world distance in meters
          var distance = currentCenter.distanceTo([lat, lng]);

          if (distance < 10 && currentZoom === targetZoom) {
            // Already centered exactly, do a very fast gentle alignment
            map.panTo([lat, lng], { animate: true, duration: 0.2 });
          } else if (distance < 500) {
            // Short distance: Use smooth panning/zooming setView to completely bypass the flyTo shake bug
            map.setView([lat, lng], targetZoom, { animate: true, duration: 0.5 });
          } else {
            // Long distance: Perform the premium cinematic flying flight
            map.flyTo([lat, lng], targetZoom, { duration: 0.8 });
          }
        };

        // Helper 2: Update/Draw User Location Blue Dot
        window.updateUserLocation = function(lat, lng) {
          var latlng = [lat, lng];
          if (userMarker) {
            userMarker.setLatLng(latlng);
          } else {
            userMarker = L.marker(latlng, {
              icon: L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [10, 10] })
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
  }, [animateOnLoad]); // Only compile HTML once to keep WebView fast and smooth

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "MAP_READY") {
        if (onMapLoaded) {
          onMapLoaded();
        }
      } else if (data.type === "log") {
        console.log("[Leaflet Map Log]:", data.message);
      } else if (data.type === "error") {
        console.error("[Leaflet Map Error]:", data.message);
      }
    } catch (e) {
      console.log("[WebView Message]:", event.nativeEvent.data);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scalesPageToFit={false}
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
