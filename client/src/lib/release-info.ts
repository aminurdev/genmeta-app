export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export type ReleaseInfo = {
  downloadUrl: string;
  fileSize: number;
  publishedAt: string;
  version: string;
};

export const getLatestRelease = async (): Promise<ReleaseInfo | null> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/aminurdev/genmeta-app/releases/latest`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) throw new Error("Failed to fetch release info");
    const data = await response.json();

    // Find the Windows executable in the assets
    const windowsExe = data.assets.find(
      (asset: GitHubAsset) =>
        asset.name.startsWith("GenMeta-Setup-") && asset.name.endsWith(".exe"),
    );

    return {
      version: data.tag_name,
      downloadUrl: windowsExe?.browser_download_url,
      fileSize: windowsExe?.size
        ? Math.round(windowsExe.size / (1024 * 1024))
        : 0,
      publishedAt: data.published_at,
    };
  } catch (error) {
    console.error("Error fetching release info:", error);
    return null;
  }
};
