<script lang="ts">
  import { onMount } from "svelte";
  import { playerState, attachAudio, toggle, next, prev, seek, playIndex } from "@/lib/music/player";
  import { formatClock } from "@/lib/music/format";

  export let isEn = false;

  let audioEl: HTMLAudioElement | null = null;
  let barVisible = true;
  let queueOpen = false;

  $: state = $playerState;
  $: current = state.tracks[state.currentIndex];
  $: progress = state.duration > 0 ? Math.round((state.currentTime / state.duration) * 1000) : 0;

  onMount(() => {
    attachAudio(audioEl);
  });

  function onSeek(e: Event) {
    const value = Number((e.target as HTMLInputElement).value || 0);
    seek(value / 1000);
  }

  function pick(index: number) {
    queueOpen = false;
    void playIndex(index);
  }
</script>

<div class="music-player-root">
<audio id="music-audio" preload="metadata" class="hidden" bind:this={audioEl}></audio>

<button
  id="music-fab-toggle"
  title="Toggle player"
  aria-label="Toggle music player"
  class="music-fab"
  on:click={() => (barVisible = !barVisible)}>🎵</button
>

<div class="music-bottom-player" id="music-bottom-player" class:player-hidden={!barVisible}>
  <div
    class="music-bottom-cover"
    id="music-bottom-cover"
    style={current?.cover ? `background-image:url(${current.cover})` : ""}
  ></div>
  <div class="min-w-0 flex-1">
    <p id="music-bottom-title" class="music-bottom-text">{current?.title || "-"}</p>
    <p id="music-bottom-artist" class="music-bottom-text music-bottom-sub">{current?.artist || "-"}</p>
    <div class="music-progress-wrap">
      <span id="music-current-time" class="music-time">{formatClock(state.currentTime)}</span>
      <input
        id="music-progress"
        class="music-progress"
        type="range"
        min="0"
        max="1000"
        step="1"
        value={progress}
        on:input={onSeek}
      />
      <span id="music-total-time" class="music-time">{formatClock(state.duration)}</span>
    </div>
  </div>
  <span id="music-player-position" class="music-position-info">
    {state.tracks.length ? `${state.currentIndex + 1} / ${state.tracks.length}` : "-"}
  </span>
  <button id="music-prev" class="music-control" type="button" aria-label="Prev" on:click={() => prev()}>◀</button>
  <button
    id="music-main-play"
    class="music-control primary music-control-play"
    class:playing={state.playing}
    type="button"
    aria-label="Play"
    on:click={toggle}
  >
    <span class="music-control-icon music-control-icon-play hidden" class:hidden={state.playing} aria-hidden="true">▶</span>
    <span class="music-control-icon music-control-icon-pause hidden" class:hidden={!state.playing} aria-hidden="true">❚❚</span>
  </button>
  <button id="music-next" class="music-control" type="button" aria-label="Next" on:click={() => next()}>▶</button>
  <button
    id="music-playlist-btn"
    class="music-control music-playlist-btn"
    type="button"
    aria-label="Playlist"
    on:click={() => (queueOpen = !queueOpen)}>☰</button
  >
</div>

{#if queueOpen}
  <div class="global-music-playlist-modal">
    <div class="global-music-playlist-modal-backdrop" on:click={() => (queueOpen = false)} role="presentation"></div>
    <div class="global-music-playlist-modal-content" role="dialog" aria-label="Playlist">
      <div class="global-music-playlist-modal-header">
        <h3 class="global-music-playlist-modal-title">{isEn ? "Queue" : "播放列表"}</h3>
        <button class="global-music-playlist-modal-close" type="button" on:click={() => (queueOpen = false)}>×</button>
      </div>
      <ul class="global-music-playlist-modal-list">
        {#if !state.tracks.length}
          <li class="global-music-playlist-modal-item" style="justify-content:center;color:var(--text-color-70)">
            {isEn ? "No tracks" : "暂无歌曲"}
          </li>
        {/if}
        {#each state.tracks as track, idx (track.id + "-" + idx)}
          <li>
            <button
              class="global-music-playlist-modal-item"
              class:active={idx === state.currentIndex}
              type="button"
              on:click={() => pick(idx)}
            >
              <div class="global-music-playlist-modal-item-index">
                {idx === state.currentIndex ? "▶" : String(idx + 1).padStart(2, "0")}
              </div>
              <div class="global-music-playlist-modal-item-info">
                <div class="global-music-playlist-modal-item-title">{track.title || "Unknown"}</div>
                <div class="global-music-playlist-modal-item-artist">{track.artist || "Unknown Artist"}</div>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}
</div>

