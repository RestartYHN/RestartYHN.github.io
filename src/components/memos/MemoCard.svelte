<script lang="ts">
  import { onMount } from 'svelte';
  import i18nit from '../../i18n/translation.ts';

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
  let loaded = $state(false);

  const API = 'https://comments.restartyhn.top';

  onMount(async () => {
    if (memoId) {
      try {
        const res = await fetch(`${API}/api/memos/${memoId}/reactions`);
        if (res.ok) {
          const d = await res.json();
          reactions = d.reactions || {};
          myReactions = d.myReactions || [];
        }
      } catch {}
      loaded = true;
    }
  });

  async function toggleReaction(type: string) {
    const had = myReactions.includes(type);
    if (had) {
      myReactions = myReactions.filter(r => r !== type);
      reactions = { ...reactions, [type]: Math.max(0, (reactions[type] || 1) - 1) };
    } else {
      myReactions = [...myReactions, type];
      reactions = { ...reactions, [type]: (reactions[type] || 0) + 1 };
    }
    try {
      await fetch(`${API}/api/memos/${memoId}/react`, {
        method: had ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: type })
      });
    } catch {}
  }

  async function clearReactions() {
    reactions = {}; myReactions = [];
    try {
      await fetch(`${API}/api/memos/${memoId}/react`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: 'all' })
      });
    } catch {}
  }

  const REACT_TYPES = [
    { key: '❤️', label: '爱' },
    { key: '😂', label: '笑' },
    { key: '😅', label: '汗' },
    { key: '👀', label: '盯' },
    { key: '🎉', label: '贺' },
    { key: '😮', label: '哇' },
    { key: '😆', label: '乐' },
    { key: '😉', label: '眨' },
    { key: '😭', label: '哭' },
    { key: '🍀', label: '运' },
  ];

  function toggleReaction(type: string) {
    const had = myReactions.includes(type);
    if (had) {
      myReactions = myReactions.filter(r => r !== type);
      reactions = { ...reactions, [type]: Math.max(0, (reactions[type] || 1) - 1) };
    } else {
      myReactions = [...myReactions, type];
      reactions = { ...reactions, [type]: (reactions[type] || 0) + 1 };
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
      class="w-6 h-6 rounded-full border border-[var(--button-border-color)] flex items-center justify-center text-xs hover:bg-[var(--button-hover-color)] transition-colors flex-shrink-0"
      title="表情">
      😊
    </button>
    {#if hasAnyReaction}
      <button on:click={clearReactions}
        class="text-[10px] text-[var(--text-color-70)] hover:text-red-500 transition-colors flex-shrink-0"
        title="清除所有反应">
        ↺
      </button>
    {/if}
    <div class="flex items-center gap-0.5 flex-wrap">
      {#each REACT_TYPES as rt}
        {@const cnt = reactions[rt.key] || 0}
        {#if cnt > 0}
          <button on:click={() => toggleReaction(rt.key)}
            class="text-xs hover:bg-[var(--button-hover-color)] rounded px-1 py-0.5 transition-colors flex-shrink-0"
            class:font-bold={myReactions.includes(rt.key)}
            class:text-[var(--link-color)]={myReactions.includes(rt.key)}>
            {rt.key} {cnt}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  {#if showReactions}
    <div class="mt-1 grid grid-cols-5 gap-1 text-xs w-fit">
      {#each REACT_TYPES as rt}
        {@const cnt = reactions[rt.key] || 0}
        <button on:click={() => toggleReaction(rt.key)}
          class="px-1.5 py-0.5 rounded hover:bg-[var(--button-hover-color)] transition-colors text-center"
          class:font-bold={myReactions.includes(rt.key)}
          class:text-[var(--link-color)]={myReactions.includes(rt.key)}>
          {rt.key} {cnt > 0 ? cnt : ''}
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
