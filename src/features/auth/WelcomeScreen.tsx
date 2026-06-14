import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/Screen';
import { COLORS, SHADOWS } from '../../theme/theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
const {
  height
} = Dimensions.get('window');
const SLIDES = [{
  title: "Welcome",
  subtitle: "Glad to see you here!",
  description: "Login to continue your journey with us and explore more."
}, {
  title: "Instant QR Tickets",
  subtitle: "Skip the Ticket Queues",
  description: "Book single-journey bus/metro tickets and daily transit passes in seconds using contactless QR codes."
}, {
  title: "Locate EV Chargers",
  subtitle: "Find Charging Stations",
  description: "Explore and navigate to nearest electric vehicle charging stations across the capital city."
}];
export const WelcomeScreen = ({
  navigation
}: any) => {
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = React.useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const dynamicPadding = {
    paddingLeft: Math.max(24, insets.left),
    paddingRight: Math.max(24, insets.right)
  };
  const switchSlide = (index: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setActiveSlide(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    });
  };
  React.useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeSlide + 1) % SLIDES.length;
      switchSlide(nextIndex);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeSlide]);
  return <View style={styles.container}>
      <ScreenContainer noPadding ignoreTopSafe style={styles.screenContainer}>
        {}
        <View style={[styles.headerContainer, {
        paddingTop: insets.top || 16
      }, dynamicPadding]}>
          <View style={styles.headerBg} />
        </View>

        {}
        <View style={[styles.mainContent, {
        paddingBottom: insets.bottom || 24
      }, dynamicPadding]}>
          {}
          <Animated.View style={[styles.textContent, {
          opacity: fadeAnim
        }]}>
            <Text style={styles.headlineTitle}>{SLIDES[activeSlide].title}</Text>
            <Text style={styles.subTitle}>{SLIDES[activeSlide].subtitle}</Text>
            <Text style={styles.bodyText}>{SLIDES[activeSlide].description}</Text>
          </Animated.View>

          {}
          <View style={styles.actionsContainer}>
            {}
            <View style={styles.dotsContainer}>
              {SLIDES.map((_, index) => <TouchableOpacity key={index} onPress={() => switchSlide(index)} activeOpacity={0.8} style={styles.dotTouch}>
                  <View style={[styles.dot, activeSlide === index ? styles.dotActive : styles.dotInactive]} />
                </TouchableOpacity>)}
            </View>

            {}
            <View style={styles.buttonGroup}>
              {}
              <PrimaryButton title="Login" onPress={() => navigation.navigate('Login')} activeOpacity={0.9} iconElement={<MaterialIcons name="arrow-forward" size={20} color="#ffffff" />} iconPosition="right" />

              {}
              <PrimaryButton title="Sign Up" onPress={() => navigation.navigate('Signup')} activeOpacity={0.8} style={styles.signupButton} textStyle={styles.signupButtonText} />
            </View>
          </View>
        </View>
      </ScreenContainer>
    </View>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  headerContainer: {
    height: height * 0.30,
    position: 'relative'
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4
    },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8
  },
  textContent: {
    gap: 10,
    paddingTop: 8
  },
  headlineTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  subTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  actionsContainer: {
    gap: 24,
    marginTop: 'auto',
    paddingBottom: 16
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  dotActive: {
    backgroundColor: COLORS.primary
  },
  dotInactive: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent'
  },
  dotTouch: {
    padding: 6
  },
  buttonGroup: {
    gap: 16
  },
  loginButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.soft
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  },
  signupButton: {
    height: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined
  }
});