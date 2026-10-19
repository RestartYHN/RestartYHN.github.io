<script lang="ts">
  import { onMount } from 'svelte';
  import i18nit from '../../i18n/translation.ts';
  import { siteConfig } from '@/config';
  import { REACTION_TYPES as REACT_TYPES } from '@/lib/reactions';
  import SmileIcon from '../misc/SmileIcon.svelte';

  let { dateFormatted = "", words = 0, minutes = 0, language = 'zh-cn', memoId = '' } = $props();

  const t = i18nit(language);

  let isExpanded = $state(false);
  let contentHeight = $state(0);
  const MAX_HEIGHT = 200;

  let needsCollapse = $derived(contentHeight > MAX_HEIGHT);

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  let showReactions = $state(false);
  let reactions = $state<Record<string, number>>({});
  let myReactions = $state<string[]>([]);
  let reactPending = $state(false);
  // Bumped on every user action. The initial GET may write state only while this
  // is unchanged — otherwise a slow first load lands after the optimistic update
  // and silently reverts it (reaction shows up, then disappears).
  let stateSeq = 0;
  const API = siteConfig.comments.backendUrl;
  onMount(async () => {
    if (!memoId) return;
    const startedAt = stateSeq;
    try {
      const res = await fetch(`${API}/api/memos/${memoId}/reactions`);
      if (!res.ok) return;
      const d = await res.json();
      if (startedAt !== stateSeq) return;
      reactions = d.reactions || {};
      myReactions = d.myReactions || [];
    } catch {}
  });

  async function toggleReaction(type: string) {
    if (reactPending) return;
    reactPending = true;
    stateSeq++;
    const had = myReactions.includes(type);
    const prevR = { ...reactions };
    const prevMy = [...myReactions];
    if (had) {
      myReactions = myReactions.filter(r => r !== type);
      reactions = { ...reactions, [type]: Math.max(0, (reactions[type] || 1) - 1) };
    } else {
      myReactions = [...myReactions, type];
      reactions = { ...reactions, [type]: (reactions[type] || 0) + 1 };
    }
    try {
      const res = await fetch(`${API}/api/memos/${memoId}/react`, {
        method: had ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: type })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json().catch(() => null);
      if (d && d.reactions) { reactions = d.reactions; myReactions = d.myReactions || []; }
    } catch {
      reactions = prevR;
      myReactions = prevMy;
    } finally {
      reactPending = false;
    }
  }

  async function clearReactions() {
    const prevR = { ...reactions };
    const prevMy = [...myReactions];
    reactions = {}; myReactions = [];
    try {
      const res = await fetch(`${API}/api/memos/${memoId}/react`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: 'all' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      reactions = prevR;
      myReactions = prevMy;
    }
  }


  let hasAnyReaction = $derived(REACT_TYPES.some(rt => (reactions[rt.key] || 0) > 0));
</script>

<div class="memo-card rounded-lg p-6 mb-6 shadow-sm border border-[var(--button-border-color)]" >
  <div class="flex items-center justify-between mb-4">
    <span class="text-base font-bold text-[var(--text-color)]">
      {dateFormatted}
    </span>
    <span class="text-sm text-[var(--text-color-70)]">
      {words} {t('memoCard.words')} · {minutes} {t('memoCard.minutes')}
    </span>
  </div>

  <div class="relative">
    <div
      class="onload-animation overflow-hidden"
      style="max-height: {needsCollapse && !isExpanded ? MAX_HEIGHT + 'px' : 'none'};"
    >
      <div bind:clientHeight={contentHeight}>
        <slot />
      </div>
    </div>

    {#if needsCollapse && !isExpanded}
      <div 
        class="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[var(--bg-color,#fff)] to-transparent pointer-events-none"
      ></div>
    {/if}
  </div>

  <div class="mt-2 flex items-center gap-2 text-sm text-[var(--text-color-70)]">
    <button on:click={() => showReactions = !showReactions}
      class="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-[var(--button-hover-color)] transition-colors flex-shrink-0 {showReactions
        ? 'border-[var(--link-color)] text-[var(--link-color)]'
        : 'border-[var(--button-border-color)]'}"
      title="表情"
      aria-label="表情"
      aria-expanded={showReactions}>
      <SmileIcon size={18} />
    </button>
    <div class="flex items-center gap-1 flex-wrap">
      {#each REACT_TYPES as rt}
        {@const cnt = reactions[rt.key] || 0}
        {#if cnt > 0}
          <button on:click={() => toggleReaction(rt.key)}
            class="reaction-chip flex-shrink-0"
            class:is-active={myReactions.includes(rt.key)}>
            {rt.key} {cnt}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  {#if showReactions}
    <div class="reaction-panel">
      {#each REACT_TYPES as rt}
        {@const cnt = reactions[rt.key] || 0}
        <button on:click={() => toggleReaction(rt.key)}
          class:is-active={myReactions.includes(rt.key)}>
          {rt.key}{#if cnt > 0}<span>{cnt}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if needsCollapse}
    <div class="mt-2 flex justify-center">
      <button
        class="text-sm hover:text-[var(--link-color)] transition-colors font-bold py-1 px-4 cursor-pointer"
        on:click={toggleExpand}
      >
        {isExpanded ? t('memoCard.collapsed') : t('memoCard.expanded')}
      </button>
    </div>
  {/if}
</div>
