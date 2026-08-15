import { APP_VERSION } from '../constants/version';
import { UpdateServerResponse, AppUpdateData } from '../types/update';

/**
 * Compare two semver version strings (e.g. "1.0.7" vs "0.1.1").
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2.
 */
export function compareVersions(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Fetches the update payload from server and determines if an update is available.
 */
export async function checkForAppUpdates(updateUrl: string): Promise<AppUpdateData | null> {
  try {
    const response = await fetch(updateUrl);
    if (!response.ok) return null;

    const data: UpdateServerResponse = await response.json();
    const windowsInfo = data.platforms?.windows;

    if (!windowsInfo || !windowsInfo.latest_version) return null;

    const isNewer = compareVersions(windowsInfo.latest_version, APP_VERSION) > 0;
    if (isNewer) {
      const exeArtifact = data.artifacts?.find(a => a.platform === 'windows' && a.type === 'exe');
      const exeUrl = exeArtifact?.exe_url || data.exe_url;

      return {
        latestVersion: windowsInfo.latest_version,
        currentVersion: APP_VERSION,
        buildNumber: windowsInfo.build_number,
        changelog: windowsInfo.changelog || 'No release notes provided for this version.',
        downloadUrl: exeUrl,
      };
    }
  } catch (err) {
    console.error('Failed to check for software updates:', err);
  }
  return null;
}
