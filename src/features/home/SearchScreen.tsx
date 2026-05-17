import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { useAppStore } from "../../store/useAppStore";
import { logAction } from "../../services/logService";

interface Route {
  route: string;
  directions: {
    up: {
      from: string;
      to: string;
      stops: string[];
    };
    down?: {
      from: string;
      to: string;
      stops: string[];
    };
  };
}

export const SearchScreen = ({ navigation }: any) => {
  const { recentRoutes, addRecentRoute, clearRecentRoutes, removeRecentRoute } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "routes"));
        const fetchedRoutes: Route[] = [];
        querySnapshot.forEach((doc) => {
          fetchedRoutes.push(doc.data() as Route);
        });
        setRoutes(fetchedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const allDirectionRoutes = React.useMemo(() => {
    const list: any[] = [];
    routes.forEach((r: any) => {
      // Format 1: Has directions.up and directions.down
      if (r.directions) {
        if (r.directions.up) {
          list.push({
            route: r.route || r.id || r.routeNumber,
            id: `${r.route || r.id || r.routeNumber}-UP`,
            directionType: 'UP',
            from: r.directions.up.from || r.directions.up.stops?.[0] || 'Origin',
            to: r.directions.up.to || r.directions.up.stops?.[r.directions.up.stops.length - 1] || 'Destination',
            originalRoute: r,
          });
        }
        if (r.directions.down) {
          list.push({
            route: r.route || r.id || r.routeNumber,
            id: `${r.route || r.id || r.routeNumber}-DOWN`,
            directionType: 'DOWN',
            from: r.directions.down.from || r.directions.down.stops?.[0] || 'Origin',
            to: r.directions.down.to || r.directions.down.stops?.[r.directions.down.stops.length - 1] || 'Destination',
            originalRoute: r,
          });
        }
      } 
      // Format 2: Flat route with stops
      else {
        const routeName = r.route || r.id || r.routeNumber;
        list.push({
          route: routeName,
          id: `${routeName}-UP`,
          directionType: 'UP',
          from: r.origin || r.stops?.[0] || 'Origin',
          to: r.destination || r.stops?.[r.stops.length - 1] || 'Destination',
          originalRoute: r,
        });
      }
    });
    return list;
  }, [routes]);

  const filteredRoutes = React.useMemo(() => {
    const queryLower = searchQuery.toLowerCase().replace(/[\s-]/g, '');
    return allDirectionRoutes.filter((item) => {
      const normalizedRoute = item.route.toLowerCase().replace(/[\s-]/g, '');
      return normalizedRoute.includes(queryLower);
    });
  }, [allDirectionRoutes, searchQuery]);

  const mappedRecentRoutes = React.useMemo(() => {
    const list: any[] = [];
    recentRoutes.forEach((r: any) => {
      if (r.directions) {
        if (r.directions.up) {
          list.push({
            route: r.route || r.id || r.routeNumber,
            id: `${r.route || r.id || r.routeNumber}-UP`,
            directionType: 'UP',
            from: r.directions.up.from || r.directions.up.stops?.[0] || 'Origin',
            to: r.directions.up.to || r.directions.up.stops?.[r.directions.up.stops.length - 1] || 'Destination',
            originalRoute: r,
          });
        }
        if (r.directions.down) {
          list.push({
            route: r.route || r.id || r.routeNumber,
            id: `${r.route || r.id || r.routeNumber}-DOWN`,
            directionType: 'DOWN',
            from: r.directions.down.from || r.directions.down.stops?.[0] || 'Origin',
            to: r.directions.down.to || r.directions.down.stops?.[r.directions.down.stops.length - 1] || 'Destination',
            originalRoute: r,
          });
        }
      } else {
        const routeName = r.route || r.id || r.routeNumber;
        list.push({
          route: routeName,
          id: `${routeName}-UP`,
          directionType: 'UP',
          from: r.origin || r.stops?.[0] || 'Origin',
          to: r.destination || r.stops?.[r.stops.length - 1] || 'Destination',
          originalRoute: r,
        });
      }
    });
    return list;
  }, [recentRoutes]);

  const renderRouteItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.routeCard} 
      activeOpacity={0.7}
      onPress={async () => {
        try {
          await logAction({
            userId: auth.currentUser?.uid || 'guest',
            userName: auth.currentUser?.displayName || 'Delhi Traveler',
            userEmail: auth.currentUser?.email || '',
            action: 'SEARCH_ROUTE',
            details: `User viewed details for Route ${item.route} (${item.directionType})`,
            type: 'USER',
            targetType: 'ROUTE',
            targetId: item.route,
            deviceId: useAppStore.getState().deviceId || undefined
          });
        } catch {}
        addRecentRoute(item.originalRoute);
        navigation.navigate("RouteDetail", { routeId: item.route, direction: item.directionType });
      }}
    >
      <View style={styles.leftCol}>
        <View style={styles.busIconBox}>
          <MaterialCommunityIcons name="bus" size={26} color="#333" />
        </View>
        <View style={styles.visualPath}>
          <View style={styles.circle} />
          <View style={styles.line} />
          <View style={styles.circle} />
        </View>
      </View>
      
      <View style={styles.routeInfo}>
        <Text style={styles.routeNumber}>{item.route}</Text>
        <View style={styles.textPath}>
          <Text style={styles.terminalName} numberOfLines={1}>
            {item.from}
          </Text>
          <Text style={styles.terminalName} numberOfLines={1}>
            {item.to}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, addRecentRoute]);

  const renderRecentRouteItem = useCallback(({ item }: { item: Route }) => {
    const renderRightActions = (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
      const trans = dragX.interpolate({
        inputRange: [-70, 0],
        outputRange: [0, 70],
        extrapolate: "clamp",
      });

      return (
        <TouchableOpacity 
          style={styles.deleteAction} 
          onPress={() => removeRecentRoute(item.route)}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ translateX: trans }] }}>
            <MaterialCommunityIcons name="trash-can-outline" size={26} color="#FFF" />
          </Animated.View>
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable 
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        {renderRouteItem({ item })}
      </Swipeable>
    );
  }, [renderRouteItem, removeRecentRoute]);

  const renderSeparator = useCallback(() => (
    <View style={styles.divider} />
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="yellow" translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search 500+ Route"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              multiline={false}
              scrollEnabled
              textAlign="left"
              numberOfLines={1}
            />
          </View>
        </View>

        {searchQuery.length > 0 ? (
          loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#D32F2F" />
            </View>
          ) : (
            <FlashList
              data={filteredRoutes}
              renderItem={renderRouteItem}
              keyExtractor={(item) => item.id}
              estimatedItemSize={80}
              ItemSeparatorComponent={renderSeparator}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No routes found</Text>
                </View>
              }
            />
          )
        ) : (
          mappedRecentRoutes.length > 0 && (
            <View style={{ flex: 1 }}>
              <FlashList
                data={mappedRecentRoutes}
                renderItem={renderRecentRouteItem}
                keyExtractor={(item) => `recent-${item.id}`}
                estimatedItemSize={80}
                ItemSeparatorComponent={renderSeparator}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFF",
    overflow: "visible",
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
    overflow: "visible",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: "#555",
    fontWeight: "400",
    textAlign: "left",
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },
  loaderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  routeCard: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  leftCol: {
    width: 40,
    alignItems: "center",
  },
  busIconBox: {
    height: 35,
    justifyContent: "center",
  },
  visualPath: {
    alignItems: "center",
    marginTop: 2,
    height: 35,
    justifyContent: "space-between",
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#B91C1C",
    backgroundColor: "transparent",
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: "#B91C1C",
    marginVertical: 2,
  },
  routeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
    height: 30,
    textAlignVertical: "center",
  },
  textPath: {
    height: 35,
    justifyContent: "space-between",
    marginTop: 2,
  },
  terminalName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  emptyBox: {
    paddingTop: 50,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 14,
    color: "#D32F2F",
    fontWeight: "600",
  },
  deleteAction: {
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginHorizontal: 0,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
    alignSelf: 'center',
  },
  directionText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

