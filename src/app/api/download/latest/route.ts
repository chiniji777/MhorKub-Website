import { NextResponse } from "next/server";

const GITHUB_OWNER = "chiniji777";
const GITHUB_REPO = "MhorKub-Product";

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GitHubAsset[];
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 }, // cache 5 min
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch release info" },
        { status: 502 }
      );
    }

    const release: GitHubRelease = await res.json();

    // Find the .exe installer asset
    const installer = release.assets.find(
      (a) => a.name.endsWith(".exe") && a.name.includes("Setup")
    );

    return NextResponse.json({
      version: release.tag_name.replace(/^v/, ""),
      tagName: release.tag_name,
      name: release.name,
      releaseNotes: release.body,
      publishedAt: release.published_at,
      releaseUrl: release.html_url,
      downloadUrl: installer?.browser_download_url || release.html_url,
      fileName: installer?.name || "",
      fileSize: installer?.size || 0,
      downloadCount: installer?.download_count || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch release info" },
      { status: 500 }
    );
  }
}
