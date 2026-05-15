import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  variant?: 'login' | 'signup';
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

export const PremiumHeader = ({ title, subtitle, variant = 'login', onBack }: PremiumHeaderProps) => {
  const isSignup = variant === 'signup';

  return (
    <LinearGradient
      colors={['#B3261E', '#8C1D18']}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.highlight} />
      </View>
      
      <SafeAreaView edges={['top']} style={styles.content}>
        <View style={styles.topRow}>
          {isSignup ? (
            <TouchableOpacity 
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/images/icon.png')} 
                style={styles.logo}
                contentFit="contain"
                transition={500}
              />
            </View>
          )}
        </View>

        <View style={[styles.textWrapper, !isSignup && styles.loginPadding]}>
          <Text style={[styles.title, isSignup ? styles.signupTitle : styles.loginTitle]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, isSignup ? styles.signupSubtitle : styles.loginSubtitle]}>
            {subtitle}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#B3261E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    position: 'absolute',
    top: -width * 0.2,
    left: -width * 0.1,
    width: width * 1.5,
    height: width * 0.5,
    borderRadius: width,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  topRow: {
    height: 60,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  logoWrapper: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 35,
    height: 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    zIndex: 10,
  },
  loginPadding: {
    paddingTop: 10,
  },
  title: {
    color: 'white',
    lineHeight: 46,
  },
  loginTitle: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  signupTitle: {
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    fontWeight: '400',
  },
  loginSubtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  signupSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
