import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, StatusBar, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../theme/theme";

interface PendingScreenProps {
  visible: boolean;
  onAnimationEnd: () => void;
  amount?: number | string;
  route?: string;
}
export const PendingScreen: React.FC<PendingScreenProps> = ({
  visible,
  onAnimationEnd,
  amount,
  route
}) => {
  const [status, setStatus] = useState<"processing" | "success" | "done">("processing");
  const [showRedirect, setShowRedirect] = useState(visible);
  const mainOpacity = useRef(new Animated.Value(1)).current;
  const mainTranslateY = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const tickScale = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation | null = null;
    if (visible && status === "processing") {
      spinValue.setValue(0);
      spinAnimation = Animated.loop(Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      }));
      spinAnimation.start();
    }
    return () => {
      if (spinAnimation) spinAnimation.stop();
    };
  }, [visible, status]);
  useEffect(() => {
    if (visible) {
      setStatus("processing");
      setShowRedirect(true);
      mainOpacity.setValue(1);
      mainTranslateY.setValue(0);
      tickScale.setValue(0);
      rippleScale.setValue(0.5);
      rippleOpacity.setValue(0.6);
      detailsOpacity.setValue(0);
      const successTimer = setTimeout(() => {
        setStatus("success");
        Animated.parallel([Animated.spring(tickScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        }), Animated.timing(rippleScale, {
          toValue: 1.4,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }), Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        }), Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 500,
          delay: 150,
          useNativeDriver: true
        })]).start();
        const exitTimer = setTimeout(() => {
          Animated.parallel([Animated.timing(mainOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }), Animated.timing(mainTranslateY, {
            toValue: 50,
            duration: 400,
            useNativeDriver: true
          })]).start(() => {
            setStatus("done");
            setShowRedirect(false);
            onAnimationEnd();
          });
        }, 2200);
        return () => clearTimeout(exitTimer);
      }, 1800);
      return () => {
        clearTimeout(successTimer);
      };
    } else {
      setShowRedirect(false);
    }
  }, [visible]);
  if (!showRedirect) return null;
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });
  return <Animated.View style={[styles.overlay, {
    opacity: mainOpacity,
    transform: [{
      translateY: mainTranslateY
    }]
  }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={true} />
      
      {status === "processing" ? <View style={styles.container}>
          <Animated.View style={{
        transform: [{
          rotate: spin
        }]
      }}>
            <MaterialCommunityIcons name="loading" size={64} color={COLORS.info} />
          </Animated.View>
          <Text style={styles.processingText}>Processing Payment...</Text>
          <Text style={styles.processingSubtext}>Confirming transaction with bank</Text>
        </View> : <View style={styles.container}>
          
          <View style={styles.checkWrapper}>
            <Animated.View style={[styles.ripple, {
          opacity: rippleOpacity,
          transform: [{
            scale: rippleScale
          }]
        }]} />
            <Animated.View style={[styles.checkCircle, {
          transform: [{
            scale: tickScale
          }]
        }]}>
              <MaterialCommunityIcons name="check-bold" size={48} color={COLORS.white} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.successContent, {
        opacity: detailsOpacity
      }]}>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            
            {amount !== undefined && <Text style={styles.successAmount}>₹{Number(amount) % 1 === 0 ? Number(amount).toFixed(0) : Number(amount).toFixed(1)}</Text>}

            <View style={styles.detailsCard}>
              <Text style={styles.detailsText}>
                Paid to <Text style={styles.boldText}>One Delhi</Text>
              </Text>
              {route && <Text style={styles.detailsSubtext}>
                  Bus Route: <Text style={styles.boldText}>{route}</Text>
                </Text>}
            </View>
          </Animated.View>
        </View>}

      
      <View style={styles.footer}>
        <View style={styles.securedBadge}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#09B360" />
          <Text style={styles.securedText}>Secured by UPI</Text>
        </View>
      </View>
    </Animated.View>;
};
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 40
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  processingText: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 24,
    textAlign: "center"
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center"
  },
  checkWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  ripple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F8F0",
    borderWidth: 2,
    borderColor: "#A3E635"
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#09B360",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  successContent: {
    alignItems: "center",
    marginTop: 30,
    width: "100%",
    paddingHorizontal: 20
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#09B360",
    textAlign: "center"
  },
  successAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 15
  },
  detailsCard: {
    marginTop: 25,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "85%",
    alignItems: "center"
  },
  detailsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center"
  },
  detailsSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center"
  },
  boldText: {
    fontWeight: "600",
    color: COLORS.text
  },
  footer: {
    alignItems: "center",
    width: "100%"
  },
  securedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6
  },
  securedText: {
    fontSize: 14,
    color: "#065F46",
    fontWeight: "600"
  }
});