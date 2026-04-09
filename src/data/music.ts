export interface MusicSeedTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audio: string;
  lyric: string;
}

export interface MusicConfig {
  apiBase: string;
  neteaseApiBase: string;
  neteaseRealIp: string;
  preferDirectNeteaseApi: boolean;
  preferPublicProfile: boolean;
  preferCookieProfile: boolean;
  neteaseUserId: string;
  defaultPlaylistId: string;
  playlistSongLimit: number;
  seedTracks: MusicSeedTrack[];
}

const apiBaseFromEnv = (import.meta as any).env?.PUBLIC_MUSIC_API || "http://localhost:17171";
const neteaseApiBaseFromEnv = (import.meta as any).env?.PUBLIC_NETEASE_API || "";
const neteaseRealIpFromEnv = (import.meta as any).env?.PUBLIC_NETEASE_REAL_IP || "";

export const musicConfig: MusicConfig = {
  // You can point this to your backend proxy when deployed.
  apiBase: apiBaseFromEnv,

  // Optional: direct NetEase API base (for no-server setup, e.g. your Vercel api-enhanced URL).
  neteaseApiBase: neteaseApiBaseFromEnv,

  // Optional: force realIP for URL fetching in direct mode (helps with region-sensitive tracks).
  // Example: 211.161.244.70
  neteaseRealIp: neteaseRealIpFromEnv,

  // If true and neteaseApiBase is set, frontend calls NetEase API directly.
  preferDirectNeteaseApi: Boolean(neteaseApiBaseFromEnv),

  // If true and user id is provided, page can load your public songs without account login.
  preferPublicProfile: true,

  // If true, frontend will call backend /api/music/cookie-user first.
  // Backend must set NETEASE_MUSIC_COOKIE in .env.
  preferCookieProfile: false,

  // Optional: fill your NetEase user id later.
  neteaseUserId: "2112672342",

  // Optional: pin one playlist as your default source in no-login mode.
  defaultPlaylistId: "17446314153",

  // Maximum number of songs loaded from the selected playlist.
  playlistSongLimit: 120,

  // Placeholder cards shown before account-linked data is ready.
  seedTracks: [
    {
      id: "30431366",
      title: "奇妙能力歌",
      artist: "陈粒",
      cover: "https://p2.music.126.net/sR8j8Qn7qRrM3W6XzNn3qA==/109951170413444901.jpg",
      audio: "",
      lyric: "",
    },
    {
      id: "208902",
      title: "晴天",
      artist: "周杰伦",
      cover: "https://p1.music.126.net/Tl2qB4Pha5-3mfY8Kf7uPg==/109951167532315119.jpg",
      audio: "",
      lyric: "",
    },
    {
      id: "65528",
      title: "稻香",
      artist: "周杰伦",
      cover: "https://p1.music.126.net/4zH8fI8Q2Kx4t0WgVgH5jg==/109951165979829734.jpg",
      audio: "",
      lyric: "",
    },
  ],
};
