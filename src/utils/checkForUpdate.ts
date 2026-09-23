import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
export function selectApkAsset(assets: GitHubAsset[], supportedArchitectures: string[] | null): GitHubAsset | null {
  if (!assets || assets.length === 0) {
    return null;
  }
  const apkAssets = assets.filter(asset => asset.name.toLowerCase().endsWith('.apk'));
  if (apkAssets.length === 0) {
    return null;
  }
  if (supportedArchitectures && supportedArchitectures.length > 0) {
    for (const arch of supportedArchitectures) {
      const archLower = arch.toLowerCase();
      const matchedAsset = apkAssets.find(asset => {
        const nameLower = asset.name.toLowerCase();
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
  const universalAsset = apkAssets.find(asset => asset.name.toLowerCase().includes('universal'));
  if (universalAsset) {
    return universalAsset;
  }
  return apkAssets[0];
}
export async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    const currentVersion = Application.nativeApplicationVersion || Constants.expoConfig?.version;
    if (!currentVersion) {
      console.log('[UpdateCheck] Native application version is not available.');
      return;
    }
    const response = await fetch('https://api.github.com/repos/codebysrk/one-delhi/releases/latest', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'OneDelhi-App',
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
        'Update Available',
        `A new version (${latestVersion}) is available. Would you like to update now?\n\nFile: ${apkName}`,
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update Now',
            onPress: () => {
              Linking.openURL(downloadUrl).catch(err => {
                console.warn('[UpdateCheck] Error opening URL:', err);
                Alert.alert('Error', 'Unable to open the download link.');
              });
            },
          },
        ],
        {
          cancelable: true,
        }
      );
    } else {
      console.log('[UpdateCheck] App is up to date.');
    }
  } catch (error) {
    console.log('[UpdateCheck] Update check skipped or network unavailable:', error);
  }
}