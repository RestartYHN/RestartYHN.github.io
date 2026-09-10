import type { AlbumInfo, Playlist, Track } from "./types";

// Session-level cache for the music page side panels. The module persists across
// Astro client-side navigations, so re-entering /music reuses loaded data instead
// of refetching (which was flaky on the small shared server).
export interface PodcastCache {
  name: string;
  count: number;
  programs: any[];
}

export const pageCache: {
  playlists: Playlist[] | null;
  albums: AlbumInfo[] | null;
  podcast: PodcastCache | null;
  recent: Track[] | null;
} = {
  playlists: null,
  albums: null,
  podcast: null,
  recent: null,
};
