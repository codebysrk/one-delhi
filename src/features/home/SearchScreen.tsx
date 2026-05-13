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
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { RemixIcon } from "../../components/RemixIcon";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { useAppStore } from "../../store/useAppStore";
import { logActivity } from "../../services/logService";
import dtcData from "../../data/dtc_data.json";

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
        // Fallback to local data
        setRoutes(dtcData.routes as any);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter((r) =>
    r.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRouteItem = useCallback(({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={styles.routeCard} 
      activeOpacity={0.7}
      onPress={async () => {
        try {
          await logActivity({
            type: 'USER',
            action: 'SEARCH_ROUTE',
            details: `User viewed details for Route ${item.route}`,
            targetId: item.route,
            targetType: 'ROUTE'
          });
        } catch {}
        navigation.navigate("RouteDetail", { routeId: item.route });
      }}
    >
      <View style={styles.leftCol}>
        <View style={styles.busIconBox}>
          <RemixIcon name="bus-fill" size={26} color="#333" />
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
            {item.directions.up.from}
          </Text>
          <Text style={styles.terminalName} numberOfLines={1}>
            {item.directions.up.to}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <RemixIcon name="arrow-left-line" size={26} color="#333" />
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

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#D32F2F" />
          </View>
        ) : (
          <FlashList
            data={filteredRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item.route}
            estimatedItemSize={120}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No routes found</Text>
              </View>
            }
          />
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
    paddingTop: 5,
  },
  routeCard: {
    flexDirection: "row",
    paddingVertical: 15,
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
    marginTop: 5,
    height: 45,
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
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    height: 35,
    textAlignVertical: "center",
  },
  textPath: {
    height: 45,
    justifyContent: "space-between",
    marginTop: 5,
  },
  terminalName: {
    fontSize: 16,
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
});

