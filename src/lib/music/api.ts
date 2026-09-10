import { musicConfig } from "@/data/music";
import type {
  AlbumInfo,
  PlaylistSongsResponse,
  SearchResult,
  Track,
  UserProfile,
  UserRecord,
} from "./types";

const API_BASE = String(musicConfig.apiBase || "").replace(/\/+$/, "");

interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

export function normalizeAudioUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // HTTPS pages cannot load the NetEase CDN over plain http (mixed content).
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^http:\/\/m\d+\.music\.126\.net\//i.test(trimmed)
  ) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
}

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const cleanBase = API_BASE.replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  const url = new URL(`${cleanBase}/${cleanPath}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

// Page init can fire a burst of concurrent requests at a small shared server;
// an occasional dropped connection or upstream timeout makes one fail. Retry once.
async function getJson<T>(url: string, retried = false): Promise<T> {
  try {
    const res = await fetch(url, { referrerPolicy: "no-referrer" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (retried) throw err;
    await new Promise((resolve) => setTimeout(resolve, 600));
    return getJson<T>(url, true);
  }
}

export async function fetchTrack(id: string): Promise<Track | null> {
  const res = await getJson<ApiEnvelope<Track>>(buildUrl("/api/music/track", { id }));
  if (res?.code !== 200 || !res.data) return null;
  return { ...res.data, audio: normalizeAudioUrl(res.data.audio) };
}

export async function fetchCookieUser(): Promise<UserProfile | null> {
  const res = await getJson<ApiEnvelope<UserProfile>>(buildUrl("/api/music/cookie-user"));
  return res?.code === 200 && res.data ? res.data : null;
}

export async function fetchPublicUser(uid: string): Promise<UserProfile | null> {
  const res = await getJson<ApiEnvelope<UserProfile>>(buildUrl("/api/music/public-user", { uid }));
  return res?.code === 200 && res.data ? res.data : null;
}

export async function fetchCookiePlaylistSongs(playlistId: string): Promise<PlaylistSongsResponse | null> {
  const res = await getJson<ApiEnvelope<PlaylistSongsResponse>>(
    buildUrl("/api/music/cookie-playlist-songs", { playlistId }),
  );
  return res?.code === 200 && res.data ? res.data : null;
}

export async function fetchPublicPlaylistSongs(playlistId: string): Promise<PlaylistSongsResponse | null> {
  const res = await getJson<ApiEnvelope<PlaylistSongsResponse>>(
    buildUrl("/api/music/public-playlist-songs", { playlistId }),
  );
  return res?.code === 200 && res.data ? res.data : null;
}

export async function searchSongs(query: string): Promise<SearchResult[]> {
  const res = await getJson<ApiEnvelope<SearchResult[]>>(buildUrl("/api/music/search", { q: query }));
  return res?.code === 200 && Array.isArray(res.data) ? res.data : [];
}

export async function fetchUserRecord(type: "0" | "1" = "1"): Promise<UserRecord | null> {
  const res = await getJson<ApiEnvelope<UserRecord>>(buildUrl("/api/music/record", { type }));
  return res?.code === 200 && res.data ? res.data : null;
}

export async function fetchUserAlbums(): Promise<AlbumInfo[]> {
  const res = await getJson<ApiEnvelope<AlbumInfo[]>>(buildUrl("/api/music/albums"));
  return res?.code === 200 && Array.isArray(res.data) ? res.data : [];
}

export interface AlbumDetail {
  name: string;
  artist: string;
  cover: string;
  size: number;
  publishTime?: number | null;
  tracks: Array<{ id: string; title: string; artist: string; cover: string }>;
}

export async function fetchAlbum(id: string): Promise<AlbumDetail | null> {
  const res = await getJson<ApiEnvelope<AlbumDetail>>(buildUrl("/api/music/album", { id }));
  return res?.code === 200 && res.data ? res.data : null;
}

export async function fetchPodcastPrograms(rid: string, limit = 500, offset = 0): Promise<any[]> {
  const res = await getJson<ApiEnvelope<any>>(
    buildUrl("/api/music/podcast/programs", { rid, limit, offset }),
  );
  const data = res?.data;
  if (Array.isArray(data?.programs)) return data.programs;
  if (Array.isArray(data?.data?.programs)) return data.data.programs;
  if (Array.isArray(data)) return data;
  return [];
}
