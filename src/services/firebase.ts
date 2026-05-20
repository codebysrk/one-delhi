import firebase from '@react-native-firebase/app';
import authInstance from '@react-native-firebase/auth';
import firestoreInstance from '@react-native-firebase/firestore';
import appCheckInstance from '@react-native-firebase/app-check';

// Initialize Firebase App Check only in Production environment
if (!__DEV__) {
  try {
    const appCheck = appCheckInstance();
    const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider();

    rnfbProvider.configure({
      android: {
        provider: 'playIntegrity',
      },
      apple: {
        provider: 'appAttestWithDeviceCheckFallback',
      }
    });

    appCheck.initializeAppCheck({
      provider: rnfbProvider,
      isTokenAutoRefreshEnabled: true,
    }).then(() => {
      console.log("[AppCheck] Firebase App Check initialized successfully.");
    }).catch((err) => {
      console.error("[AppCheck] Failed to initialize App Check:", err);
    });
  } catch (err) {
    console.error("[AppCheck] App Check initialization failed:", err);
  }
} else {
  console.log("[AppCheck] Disabled in development mode to prevent local network blocks.");
}

export const auth = authInstance();
export const db = firestoreInstance();

export default firebase;
