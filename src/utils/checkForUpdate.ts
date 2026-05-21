import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  assets: GitHubAsset[];
}

/**
 * Compares two semantic version strings to determine if the latest version is newer.
 * Handles 'v' prefixes and unequal length version components.
 * 
 * @param current Current version (e.g., "2.0.1")
 * @param latest Latest version (e.g., "v2.0.2")
 * @returns true if latest is newer than current, false otherwise
 */
export function isNewerVersion(current: string, latest: string): boolean {
  const cleanCurrent = current.replace(/^v/, '').trim();
  const cleanLatest = latest.replace(/^v/, '').trim();

  const currentParts = cleanCurrent.split('.').map(part => parseInt(part, 10));
  const latestParts = cleanLatest.split('.').map(part => parseInt(part, 10));

  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < maxLength; i++) {
    const currentVal = !isNaN(currentParts[i]) ? currentParts[i] : 0;
    const latestVal = !isNaN(latestParts[i]) ? latestParts[i] : 0;

    if (latestVal > currentVal) {
      return true;
    }
    if (currentVal > latestVal) {
      return false;
    }
  }

  return false;
}

/**
 * Automatically select the correct APK asset based on the device's CPU architectures.
 * Order of preference:
 * 1. Match supportedCpuArchitectures in order.
 * 2. Fallback to universal APK.
 * 3. Fallback to any APK.
 * 
 * @param assets List of release assets
 * @param supportedArchitectures List of architectures supported by the device
 * @returns The selected asset, or null if none found
 */
export function selectApkAsset(assets: GitHubAsset[], supportedArchitectures: string[] | null): GitHubAsset | null {
  if (!assets || assets.length === 0) {
    return null;
  }

  const apkAssets = assets.filter(asset => asset.name.toLowerCase().endsWith('.apk'));
  if (apkAssets.length === 0) {
    return null;
  }

  // 1. Try matching device's supported CPU architectures
  if (supportedArchitectures && supportedArchitectures.length > 0) {
    for (const arch of supportedArchitectures) {
      const archLower = arch.toLowerCase();
      const matchedAsset = apkAssets.find(asset => {
        const nameLower = asset.name.toLowerCase();
        // Special case for x86 vs x86_64 to prevent false positive matching
        if (archLower === 'x86') {
          return nameLower.includes('x86') && !nameLower.includes('x86_64');
        }
        return nameLower.includes(archLower);
      });
      if (matchedAsset) {
        return matchedAsset;
      }
    }
  }

  // 2. Fallback to universal APK
  const universalAsset = apkAssets.find(asset => asset.name.toLowerCase().includes('universal'));
  if (universalAsset) {
    return universalAsset;
  }

  // 3. Fallback to first APK asset found
  return apkAssets[0];
}

/**
 * Checks for a newer app version on GitHub Releases and prompts the user to download.
 */
export async function checkForUpdate(): Promise<void> {
  // Check only on Android as APK installation is Android-only
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const currentVersion = Application.nativeApplicationVersion;
    if (!currentVersion) {
      console.log('[UpdateCheck] Native application version is not available.');
      return;
    }

    const response = await fetch('https://api.github.com/repos/codebysrk/one-delhi/releases/latest', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'one-delhi-app',
      },
    });

    if (!response.ok) {
      console.log(`[UpdateCheck] GitHub API returned status: ${response.status}`);
      return;
    }

    const releaseData: GitHubRelease = await response.json();
    const latestVersion = releaseData.tag_name;

    if (isNewerVersion(currentVersion, latestVersion)) {
      const selectedAsset = selectApkAsset(releaseData.assets, Device.supportedCpuArchitectures);

      const downloadUrl = selectedAsset ? selectedAsset.browser_download_url : releaseData.html_url;
      const apkName = selectedAsset ? selectedAsset.name : 'Latest Release';

      Alert.alert(
        'अपडेट उपलब्ध है',
        `एक नया अपडेट (${latestVersion}) उपलब्ध (Available) है। क्या आप इसे डाउनलोड करना चाहते हैं?\n\nफ़ाइल: ${apkName}`,
        [
          {
            text: 'बाद में',
            style: 'cancel',
          },
          {
            text: 'अपडेट करें',
            onPress: () => {
              Linking.openURL(downloadUrl).catch(err => {
                console.error('[UpdateCheck] URL खोलने में त्रुटि:', err);
                Alert.alert('त्रुटि', 'अपडेट लिंक खोलने में असमर्थ।');
              });
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log('[UpdateCheck] App is up to date.');
    }
  } catch (error) {
    console.error('[UpdateCheck] Error checking for update:', error);
  }
}
