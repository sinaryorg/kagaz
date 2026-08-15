export interface PlatformUpdateInfo {
  latest_version: string;
  build_number?: number;
  changelog?: string;
}

export interface UpdateArtifact {
  platform: string;
  type: string;
  exe_url?: string;
  msix_url?: string;
  sha256?: string;
  size_bytes?: number;
}

export interface UpdateServerResponse {
  platforms?: Record<string, PlatformUpdateInfo>;
  artifacts?: UpdateArtifact[];
  exe_url?: string;
}

export interface AppUpdateData {
  latestVersion: string;
  currentVersion: string;
  buildNumber?: number;
  changelog: string;
  downloadUrl?: string;
}
