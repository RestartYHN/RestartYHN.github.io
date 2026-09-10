import { get, writable } from "svelte/store";
import { musicConfig } from "@/data/music";
import { fetchTrack, normalizeAudioUrl } from "./api";
import type { Track } from "./types";

export interface PlayerState {
  tracks: Track[];
  currentIndex: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  loaded: boolean;
}

const store = writable<PlayerState>({
  tracks: [],
  currentIndex: 0,
  playing: false,
  currentTime: 0,
  duration: 0,
  loaded: false,
});

// Read-only view for components (`$playerState`).
export const playerState = { subscribe: store.subscribe };

const SELF_HEAL_MAX = 3;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let audioEl: HTMLAudioElement | null = null;
let bound = false;
let selfHealId: string | null = null;
let selfHealCount = 0;
let playToken = 0;
const handlers: Record<string, () => void> = {};

function patch(partial: Partial<PlayerState>) {
  store.update((s) => ({ ...s, ...partial }));
}

function emit() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("music-state-change"));
  } catch {
    /* noop */
  }
}

function isPlaceholder(track: Track | undefined): boolean {
  if (!track) return true;
  return (
    track.title === `Song ${track.id}` ||
    track.title === "Unknown" ||
    track.artist === "Unknown Artist" ||
    track.artist === "Unknown"
  );
}

function mergeTrack(base: Track, fresh: Track): Track {
  return {
    ...base,
    ...fresh,
    title: isPlaceholder(base) ? fresh.title : base.title,
    artist: isPlaceholder(base) ? fresh.artist : base.artist,
    cover: base.cover || fresh.cover,
    lyric: base.lyric || fresh.lyric,
    tlyric: base.tlyric || fresh.tlyric,
    unavailable: !fresh.audio,
  };
}

function setTrackAt(index: number, track: Track) {
  store.update((s) => {
    if (index < 0 || index >= s.tracks.length) return s;
    const tracks = s.tracks.slice();
    tracks[index] = track;
    return { ...s, tracks };
  });
}

function setAudioSource(track: Track | null) {
  if (!audioEl || !track?.audio) return;
  const next = normalizeAudioUrl(track.audio);
  const current = String(audioEl.currentSrc || audioEl.src || "");
  if (next && next !== current) {
    audioEl.src = next;
    audioEl.load();
  }
}

async function hydrateTrack(index: number): Promise<Track | null> {
  const current = get(store).tracks[index];
  if (!current) return null;
  if (current.audio) return current;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const fresh = await fetchTrack(current.id);
      if (fresh?.audio) {
        const merged = mergeTrack(current, fresh);
        setTrackAt(index, merged);
        return merged;
      }
    } catch {
      /* retry */
    }
    if (attempt < 2) await delay(600);
  }
  return current;
}

export function attachAudio(el: HTMLAudioElement | null) {
  if (!el || el === audioEl) return;
  audioEl = el;
  bind();
}

function bind() {
  if (bound || !audioEl) return;
  const audio = audioEl;

  handlers.onPlay = () => patch({ playing: true });
  handlers.onPause = () => patch({ playing: false });
  handlers.onPlaying = () => {
    selfHealCount = 0;
    patch({ playing: true });
  };
  handlers.onTime = () =>
    patch({
      currentTime: audio.currentTime,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    });
  handlers.onMeta = () => patch({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
  handlers.onEnded = () => {
    void next();
  };
  handlers.onError = () => {
    void selfHeal();
  };

  audio.addEventListener("play", handlers.onPlay);
  audio.addEventListener("pause", handlers.onPause);
  audio.addEventListener("playing", handlers.onPlaying);
  audio.addEventListener("timeupdate", handlers.onTime);
  audio.addEventListener("loadedmetadata", handlers.onMeta);
  audio.addEventListener("ended", handlers.onEnded);
  audio.addEventListener("error", handlers.onError);
  bound = true;
}

async function selfHeal() {
  const s = get(store);
  const cur = s.tracks[s.currentIndex];
  if (!cur?.id || !audioEl) return;
  if (selfHealId !== cur.id) {
    selfHealId = cur.id;
    selfHealCount = 0;
  }
  if (selfHealCount >= SELF_HEAL_MAX) return;
  selfHealCount += 1;

  try {
    const fresh = await fetchTrack(cur.id);
    const url = normalizeAudioUrl(fresh?.audio || "");
    if (!url || !audioEl) return;
    const pos = Number(audioEl.currentTime) || 0;
    setTrackAt(s.currentIndex, { ...cur, ...(fresh as Track), audio: url });
    audioEl.src = url;
    audioEl.load();
    const audio = audioEl;
    audio.addEventListener(
      "loadedmetadata",
      () => {
        try {
          if (pos > 0 && Number.isFinite(audio.duration)) audio.currentTime = pos;
        } catch {
          /* noop */
        }
      },
      { once: true },
    );
    audio.play().catch(() => {});
  } catch {
    /* noop */
  }
}

export async function playIndex(index: number) {
  const s = get(store);
  if (index < 0 || index >= s.tracks.length) return;

  const token = ++playToken;
  patch({ currentIndex: index, currentTime: 0, duration: 0 });
  emit();

  const track = await hydrateTrack(index);
  if (token !== playToken || !track) return;

  setAudioSource(track);
  if (track.audio) {
    try {
      await audioEl?.play();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") console.warn("[player] play failed", e);
    }
  }
}

export async function next() {
  const s = get(store);
  if (!s.tracks.length) return;
  await playIndex((s.currentIndex + 1) % s.tracks.length);
}

export async function prev() {
  const s = get(store);
  if (!s.tracks.length) return;
  await playIndex((s.currentIndex - 1 + s.tracks.length) % s.tracks.length);
}

export function toggle() {
  if (!audioEl) return;
  if (audioEl.paused) audioEl.play().catch(() => {});
  else audioEl.pause();
}

export function seek(ratio: number) {
  if (!audioEl) return;
  const d = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
  if (d <= 0) return;
  audioEl.currentTime = Math.max(0, Math.min(1, ratio)) * d;
}

export function setQueue(tracks: Track[], index = 0) {
  const n = tracks.length;
  const safeIndex = n ? Math.max(0, Math.min(index, n - 1)) : 0;
  store.update((s) => ({
    ...s,
    tracks,
    currentIndex: safeIndex,
    currentTime: 0,
    duration: 0,
    loaded: true,
  }));
  emit();
}

// Insert right after the current track, dedupe. Returns the resulting index. No jump.
export function insertNext(track: Track): number {
  if (!track) return get(store).currentIndex;
  let target = 0;
  store.update((s) => {
    const tracks = s.tracks.slice();
    const exist = tracks.findIndex((x) => String(x.id) === String(track.id));
    if (!tracks.length) {
      tracks.push(track);
      target = 0;
    } else if (exist !== -1) {
      target = exist;
    } else {
      target = s.currentIndex + 1;
      tracks.splice(target, 0, track);
    }
    return { ...s, tracks, loaded: true };
  });

  const s = get(store);
  if (s.tracks.length === 1 && s.tracks[0] === track) {
    patch({ currentIndex: 0 });
    setAudioSource(track); // let an empty-queue caller autoplay via #music-audio
  }
  emit();
  return target;
}

export function removeAt(index: number) {
  store.update((s) => {
    if (index < 0 || index >= s.tracks.length) return s;
    const tracks = s.tracks.slice();
    tracks.splice(index, 1);
    let currentIndex = s.currentIndex;
    if (currentIndex >= tracks.length) currentIndex = Math.max(0, tracks.length - 1);
    else if (index < currentIndex) currentIndex -= 1;
    return { ...s, tracks, currentIndex };
  });
  emit();
}

export function setIndex(index: number) {
  const s = get(store);
  if (index >= 0 && index < s.tracks.length) {
    patch({ currentIndex: index });
    emit();
  }
}

function syncState(options: { tracks?: Track[]; currentIndex?: number }) {
  store.update((s) => ({
    ...s,
    tracks: Array.isArray(options?.tracks) ? (options.tracks as Track[]) : s.tracks,
    currentIndex: Number.isFinite(options?.currentIndex)
      ? Number(options?.currentIndex)
      : s.currentIndex,
    loaded: true,
  }));
  emit();
}

function installBridge() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, any>;
  w.__MUSIC_API__ = { apiBase: musicConfig.apiBase, neteaseApiBase: musicConfig.neteaseApiBase };
  if (w.__globalMusicBootstrapV1) return;

  w.__globalMusicBootstrapV1 = {
    syncState,
    bootstrap: syncState,
    getState: () => {
      const s = get(store);
      return { tracks: s.tracks, currentIndex: s.currentIndex, loaded: s.loaded, playMode: "loop" };
    },
    getTracks: () => get(store).tracks,
    getIndex: () => get(store).currentIndex,
    getCurrentTrack: () => get(store).tracks[get(store).currentIndex] || null,
    setQueue,
    insertNext,
    setIndex,
    playIndex,
    removeAt,
    next,
    prev,
    onRouteChange: () => {},
    _marqueeSetup: () => {},
    _next: () => {
      void next();
    },
    _prev: () => {
      void prev();
    },
    _togglePlay: toggle,
  };

  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        void next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        void prev();
      }
    }
    if (e.code === "Space" && e.ctrlKey && e.altKey) {
      e.preventDefault();
      toggle();
    }
  });
}

installBridge();
