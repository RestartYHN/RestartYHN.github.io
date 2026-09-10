<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { get } from "svelte/store";
  import { musicConfig } from "@/data/music";
  import {
    fetchAlbum,
    fetchCookiePlaylistSongs,
    fetchCookieUser,
    fetchPodcastPrograms,
    fetchPublicPlaylistSongs,
    fetchPublicUser,
    fetchTrack,
    fetchUserAlbums,
    searchSongs,
  } from "@/lib/music/api";
  import { insertNext, playIndex, playerState, setQueue } from "@/lib/music/player";
  import { buildLyricLines, getActiveLyricIndex, type LyricLine } from "@/lib/music/lyrics";
  import type { AlbumInfo, Playlist, SearchResult, Track, UserProfile } from "@/lib/music/types";

  export let isEn = false;

  let user: UserProfile | null = null;
  let playlists: Playlist[] = [];
  let currentPlaylistId = "";
  let status = "";
  let loading = false;

  let albums: AlbumInfo[] = [];
  let recent: Track[] = [];
  let podcastRid = "1490741063";
  let podcastName = "";
  let podcastCount = 0;
  let podcastPrograms: any[] = [];

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

  let lastScrolledLyric = -2;
  afterUpdate(() => {
    if (activeLyric === lastScrolledLyric) return;
    lastScrolledLyric = activeLyric;
    // Scroll ONLY the lyrics container (scrollIntoView would also scroll the page).
    if (!lyricsEl) return;
    const el = lyricsEl.querySelector(".lyrics-line.active") as HTMLElement | null;
    if (!el) return;
    const target = el.offsetTop - lyricsEl.clientHeight / 2 + el.offsetHeight / 2;
    lyricsEl.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  });

  onMount(async () => {
    await loadUser();
    void loadAlbums();
    void loadPodcast();
    void loadRecent();

    // Returning to the page must not clobber the live queue/playback.
    const s = get(playerState);
    if (s.loaded && s.tracks.length) {
      currentPlaylistId = s.queueSource || "";
      return;
    }
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
    setQueue(list, 0, playlistId);
    void playIndex(0);
  }

  async function loadAlbums() {
    try {
      albums = await fetchUserAlbums();
    } catch (e) {
      console.warn("[music] load albums failed", e);
    }
  }

  async function loadPodcast() {
    try {
      const programs = await fetchPodcastPrograms(podcastRid);
      if (!programs.length) return;
      podcastPrograms = programs;
      podcastName = programs[0]?.radio?.name || (isEn ? "Podcast" : "播客");
      podcastCount = programs.length;
    } catch (e) {
      console.warn("[music] load podcast failed", e);
    }
  }

  async function loadRecent() {
    const history = (user?.recentHistory || []).slice(0, 3);
    const out: Track[] = [];
    for (const h of history) {
      try {
        const t = await fetchTrack(String(h.id));
        if (t) out.push({ ...t, playedAt: h.playedAt });
      } catch {
        /* skip */
      }
    }
    recent = out;
  }

  function playPodcast() {
    const tracks: Track[] = podcastPrograms
      .map((p) => {
        const id = String(p?.mainTrackId || p?.id || "");
        return {
          id,
          title: p?.name || p?.title || `Song ${id}`,
          artist: p?.dj?.nickname || p?.radio?.name || "Unknown Artist",
          cover: p?.coverUrl || p?.radio?.picUrl || "",
          audio: "",
          lyric: p?.description || "",
          tlyric: "",
          unavailable: false,
        };
      })
      .filter((t) => t.id);
    if (!tracks.length) return;
    setQueue(tracks, 0, `podcast:${podcastRid}`);
    void playIndex(0);
  }

  async function playAlbum(id: string) {
    status = isEn ? "Loading album..." : "正在加载专辑...";
    try {
      const album = await fetchAlbum(id);
      const tracks: Track[] = (album?.tracks || []).map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        cover: t.cover || album?.cover || "",
        audio: "",
        lyric: "",
        tlyric: "",
        unavailable: false,
      }));
      if (!tracks.length) {
        status = isEn ? "Album is empty." : "专辑为空。";
        return;
      }
      status = "";
      setQueue(tracks, 0, `album:${id}`);
      void playIndex(0);
    } catch (e) {
      console.warn("[music] load album failed", e);
      status = isEn ? "Failed to load album." : "专辑加载失败。";
    }
  }

  function playRecent(index: number) {
    if (!recent.length) return;
    setQueue(recent, index, "recent");
    void playIndex(index);
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
      <div class="lyrics-container is-scroll" bind:this={lyricsEl}>
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

    <section class="music-panel music-album-section">
      <div class="mb-3 flex items-end justify-between gap-3">
        <h2 class="music-panel-title">{isEn ? "Albums" : "收藏专辑"}</h2>
        <span class="music-panel-subtitle"
          >{albums.length ? `${albums.length} ${isEn ? "albums" : "张"}` : ""}</span
        >
      </div>
      <ul class="music-playlist-list">
        {#if !albums.length}
          <li class="music-empty">{isEn ? "No albums" : "暂无收藏专辑"}</li>
        {/if}
        {#each albums as a, idx (a.id)}
          <li>
            <button class="music-playlist-card" type="button" on:click={() => playAlbum(String(a.id))}>
              <div class="music-playlist-index">{String(idx + 1).padStart(2, "0")}</div>
              <div class="min-w-0 flex-1">
                <p class="music-playlist-name truncate">{a.name}</p>
                <p class="music-playlist-meta">
                  {a.artist}{a.size ? ` · ${a.size} ${isEn ? "tracks" : "首"}` : ""}
                </p>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </section>

    <div class="music-col-tight">
      <section class="music-panel music-mini-section">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="music-panel-title">{isEn ? "Podcasts" : "播客"}</h2>
          <span class="music-panel-subtitle"
            >{podcastCount ? `${podcastCount} ${isEn ? "episodes" : "集"}` : ""}</span
          >
        </div>
        <ul class="music-playlist-list">
          {#if !podcastName}
            <li class="music-empty">{isEn ? "No podcast" : "暂无播客"}</li>
          {/if}
          {#if podcastName}
            <li>
              <button class="music-playlist-card" type="button" on:click={playPodcast}>
                <div class="music-playlist-index">01</div>
                <div class="min-w-0 flex-1">
                  <p class="music-playlist-name truncate">{podcastName}</p>
                  <p class="music-playlist-meta">{podcastCount} {isEn ? "episodes" : "集"}</p>
                </div>
              </button>
            </li>
          {/if}
        </ul>
      </section>

      <section class="music-panel music-mini-section">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="music-panel-title">{isEn ? "Recent" : "最近播放"}</h2>
          <span class="music-panel-subtitle">{recent.length ? (isEn ? "recent" : "最近") : ""}</span>
        </div>
        <ul class="music-track-list">
          {#if !recent.length}
            <li class="music-empty">{isEn ? "No recent plays" : "暂无最近播放"}</li>
          {/if}
          {#each recent as t, idx (t.id + "-" + idx)}
            <li>
              <button class="music-track-card" type="button" on:click={() => playRecent(idx)}>
                <div class="music-track-index">{String(idx + 1).padStart(2, "0")}</div>
                <div class="min-w-0 flex-1">
                  <p class="music-track-title truncate">{t.title}</p>
                  <p class="music-track-artist truncate">{t.artist}</p>
                </div>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    </div>
  </div>
</div>
