<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { musicConfig } from "@/data/music";
  import {
    fetchCookiePlaylistSongs,
    fetchCookieUser,
    fetchPublicPlaylistSongs,
    fetchPublicUser,
    searchSongs,
  } from "@/lib/music/api";
  import { insertNext, playIndex, playerState, setQueue } from "@/lib/music/player";
  import { buildLyricLines, getActiveLyricIndex, type LyricLine } from "@/lib/music/lyrics";
  import type { Playlist, SearchResult, Track, UserProfile } from "@/lib/music/types";

  export let isEn = false;

  let user: UserProfile | null = null;
  let playlists: Playlist[] = [];
  let currentPlaylistId = "";
  let status = "";
  let loading = false;

  let query = "";
  let results: SearchResult[] = [];
  let searchOpen = false;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  let lyricLines: LyricLine[] = [];
  let lastLyricTrackId = "";
  let lyricsEl: HTMLElement | null = null;

  $: state = $playerState;
  $: currentTrack = state.tracks[state.currentIndex];
  $: {
    if (currentTrack && currentTrack.id !== lastLyricTrackId) {
      lastLyricTrackId = currentTrack.id;
      lyricLines = buildLyricLines(currentTrack.lyric, currentTrack.tlyric);
    }
  }
  $: activeLyric = getActiveLyricIndex(lyricLines, state.currentTime);

  afterUpdate(() => {
    if (!lyricsEl) return;
    const el = lyricsEl.querySelector(".lyrics-line.active");
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  onMount(async () => {
    await loadUser();
    const defaultId = musicConfig.defaultPlaylistId || playlists[0]?.id || "";
    if (defaultId) await loadPlaylist(defaultId);
  });

  async function loadUser() {
    try {
      if (musicConfig.preferCookieProfile) user = await fetchCookieUser();
      if (!user && musicConfig.preferPublicProfile && musicConfig.neteaseUserId) {
        user = await fetchPublicUser(musicConfig.neteaseUserId);
      }
      playlists = user?.playlists || [];
    } catch (e) {
      console.warn("[music] load user failed", e);
    }
  }

  async function loadPlaylist(playlistId: string) {
    if (!playlistId) return;
    currentPlaylistId = playlistId;
    loading = true;
    status = isEn ? "Loading playlist..." : "正在加载歌单...";

    let list: Track[] = [];
    try {
      const res = musicConfig.preferCookieProfile
        ? await fetchCookiePlaylistSongs(playlistId)
        : await fetchPublicPlaylistSongs(playlistId);
      list = (res?.tracks || []).map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        cover: t.cover,
        audio: "",
        lyric: "",
        tlyric: "",
        unavailable: false,
      }));
    } catch (e) {
      console.warn("[music] load playlist failed", e);
    }

    loading = false;
    if (!list.length) {
      status = isEn ? "Playlist is empty." : "该歌单为空。";
      return;
    }
    status = "";
    setQueue(list);
    void playIndex(0);
  }

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    const q = query.trim();
    if (q.length < 2) {
      results = [];
      searchOpen = false;
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        results = await searchSongs(q);
        searchOpen = results.length > 0;
      } catch {
        results = [];
        searchOpen = false;
      }
    }, 300);
  }

  function addResult(item: SearchResult) {
    const track: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      cover: item.cover,
      audio: "",
      lyric: "",
      tlyric: "",
      unavailable: false,
    };
    insertNext(track);
    searchOpen = false;
    results = [];
    query = "";
    status = isEn ? `Up next: ${item.title}` : `已加入下一首：${item.title}`;
    setTimeout(() => {
      status = "";
    }, 2000);
  }
</script>

<div class="mx-auto w-full max-w-[var(--page-width)]">
  <div class="music-search-wrap">
    <input
      class="music-search-input"
      type="text"
      placeholder={isEn ? "Search and add to queue..." : "搜索歌曲加入队列..."}
      autocomplete="off"
      bind:value={query}
      on:input={onSearchInput}
      on:focus={() => (searchOpen = results.length > 0)}
    />
    {#if searchOpen}
      <div class="music-search-results">
        {#each results as item (item.id)}
          <button class="music-search-result-item" type="button" on:click={() => addResult(item)}>
            <img class="music-search-result-cover" src={`${item.cover}?param=40y40`} alt="" referrerpolicy="no-referrer" />
            <div class="music-search-result-text">
              <div class="music-search-result-title">{item.title}</div>
              <div class="music-search-result-artist">{item.artist}</div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if status}
    <p class="music-status">{status}</p>
  {/if}

  <div class="music-main-grid">
    <section class="music-hero">
      <div
        class="music-hero-bg"
        style={currentTrack?.cover
          ? `background-image:linear-gradient(135deg, rgba(0,0,0,.22), rgba(0,0,0,.1)), url(${currentTrack.cover});background-size:cover;background-position:center;`
          : ""}
      ></div>
      <div class="music-hero-content">
        <div class="music-now-card">
          <div class="music-cover" style={currentTrack?.cover ? `background-image:url(${currentTrack.cover})` : ""}></div>
          <h3 class="music-title">{currentTrack?.title || (isEn ? "Nothing playing" : "暂无播放")}</h3>
          <p class="music-artist">{currentTrack?.artist || "-"}</p>
        </div>
      </div>
    </section>

    <section class="music-lyrics-panel">
      <div class="lyrics-container" bind:this={lyricsEl}>
        <div class="lyrics-track">
          {#if !lyricLines.length}
            <p class="lyrics-line lyrics-placeholder">{isEn ? "No lyric available" : "暂无歌词"}</p>
          {:else}
            {#each lyricLines as line, i (i)}
              <p class="lyrics-line" class:active={i === activeLyric} class:near={Math.abs(i - activeLyric) <= 2}>
                <span class="lyrics-main">{line.text || "..."}</span>
                {#if line.translation}
                  <br /><span class="lyrics-trans">{line.translation}</span>
                {/if}
              </p>
            {/each}
          {/if}
        </div>
      </div>
    </section>

    <section class="music-panel music-playlist-section">
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2 class="music-panel-title">{isEn ? "Playlists" : "歌单"}</h2>
        <span class="music-panel-subtitle">{loading ? (isEn ? "Loading..." : "加载中...") : ""}</span>
      </div>
      <ul class="music-playlist-list">
        {#if !playlists.length}
          <li class="music-empty">{isEn ? "No playlist data yet" : "暂无歌单数据"}</li>
        {/if}
        {#each playlists as pl, idx (pl.id)}
          <li>
            <button
              class="music-playlist-card"
              class:active={String(pl.id) === String(currentPlaylistId)}
              type="button"
              on:click={() => loadPlaylist(String(pl.id))}
            >
              <div class="music-playlist-index">{String(idx + 1).padStart(2, "0")}</div>
              <div class="min-w-0 flex-1">
                <p class="music-playlist-name truncate">{pl.name}</p>
                <p class="music-playlist-meta">{pl.songCount || 0} {isEn ? "songs" : "首歌"}</p>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </section>

    <section class="music-panel music-tracks-section">
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2 class="music-panel-title">{isEn ? "Tracks" : "歌曲列表"}</h2>
        <span class="music-panel-subtitle">{state.tracks.length} {isEn ? "songs" : "首"}</span>
      </div>
      <ul class="music-track-list">
        {#if !state.tracks.length}
          <li class="music-empty">{isEn ? "No tracks" : "暂无歌曲"}</li>
        {/if}
        {#each state.tracks as track, idx (track.id + "-" + idx)}
          <li>
            <button
              class="music-track-card"
              class:active={idx === state.currentIndex}
              class:unavailable={track.unavailable}
              type="button"
              on:click={() => playIndex(idx)}
            >
              <div class="music-track-index">{String(idx + 1).padStart(2, "0")}</div>
              <div class="min-w-0 flex-1">
                <p class="music-track-title truncate">{track.title}</p>
                <p class="music-track-artist truncate">{track.artist}</p>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  </div>
</div>
