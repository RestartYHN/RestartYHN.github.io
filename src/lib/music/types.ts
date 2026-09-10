export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audio: string;
  lyric?: string;
  tlyric?: string;
  unavailable?: boolean;
  playedAt?: number;
}

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
}

export interface Playlist {
  id: string;
  name: string;
  songCount: number;
}

export interface RecentPlay {
  id: string;
  playedAt: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  avatarUrl: string;
  playlists: Playlist[];
  recentHistory?: RecentPlay[];
  source?: string;
}

export interface AlbumInfo {
  id: string;
  name: string;
  artist: string;
  cover: string;
  size: number;
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  cover: string;
}

export interface PlaylistSongsResponse {
  playlistId: string;
  songs: string[];
  tracks?: PlaylistTrack[];
}

export interface UserRecord {
  top: Array<{ id: string; title: string; artist: string; cover: string; playCount: number }>;
  recent: Array<{ id: string; title: string; artist: string; cover: string; playedAt: number }>;
  weekDurationMs: number;
  listeningDays: number;
  todaySongs: number;
  todayDurationMs: number;
}
