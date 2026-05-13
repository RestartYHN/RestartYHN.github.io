<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { pinyin } from 'pinyin-pro';

  export let allTags: string[] = [];
  export let selectedTags: string[] = [];
  export let lang: string = 'zh-cn';

  const dispatch = createEventDispatcher();

  let collapsedDims = new Set<string>();
  let useOr = false;

  interface TagNode {
    dimension: string;
    values: TagValue[];
  }
  interface TagValue {
    value: string;
    count: number;
    initial: string;
  }

  function getInitial(ch: string): string {
    if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
    if (/[0-9]/.test(ch)) return '#';
    if (/[\u4e00-\u9fff]/.test(ch)) {
      const py = pinyin(ch, { pattern: 'first', toneType: 'none' });
      return py ? py.toUpperCase() : '#';
    }
    return '#';
  }

  $: tree = buildTree(allTags);
  $: initials = [...new Set((tree || []).flatMap(d => d.values.map(v => v.initial)))].sort();

  function buildTree(tags: string[]): TagNode[] {
    const map = new Map<string, Map<string, number>>();
    for (const tag of tags) {
      const idx = tag.indexOf(':');
      if (idx === -1) continue;
      const dim = tag.slice(0, idx);
      const val = tag.slice(idx + 1);
      if (!map.has(dim)) map.set(dim, new Map());
      const vm = map.get(dim)!;
      vm.set(val, (vm.get(val) || 0) + 1);
    }
    const nodes: TagNode[] = [];
    for (const [dim, vm] of map) {
      const values: TagValue[] = [];
      for (const [val, count] of vm) {
        values.push({ value: val, count, initial: getInitial(val) });
      }
      values.sort((a, b) => a.initial.localeCompare(b.initial) || a.value.localeCompare(b.value, 'zh-u-co-pinyin'));
      nodes.push({ dimension: dim, values });
    }
    nodes.sort((a, b) => a.dimension.localeCompare(b.dimension, 'zh-u-co-pinyin'));
    return nodes;
  }

  function toggleDim(dim: string) {
    if (collapsedDims.has(dim)) collapsedDims.delete(dim);
    else collapsedDims.add(dim);
    collapsedDims = collapsedDims;
  }

  function toggleTag(tag: string) {
    const idx = selectedTags.indexOf(tag);
    if (idx >= 0) selectedTags = selectedTags.filter(t => t !== tag);
    else selectedTags = [...selectedTags, tag];
    emitChange();
  }

  function emitChange() {
    dispatch('change', { selectedTags, useOr });
  }

  function toggleOr() {
    useOr = !useOr;
    emitChange();
  }

  function clearAll() {
    selectedTags = [];
    emitChange();
  }

  function isSelected(dim: string, val: string): boolean {
    return selectedTags.includes(`${dim}:${val}`);
  }

  function scrollToInitial(initial: string) {
    const el = document.querySelector(`[data-init="${initial}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="category-tree">
  {#if initials.length > 1}
    <div class="flex flex-wrap gap-0.5 mb-3 pb-2 border-b border-[var(--button-border-color)]">
      {#each initials as init}
        <button
          class="w-5 h-5 text-[11px] flex items-center justify-center rounded hover:bg-[var(--button-hover-color)] hover:text-[var(--link-color)] transition-colors text-[var(--text-color-70)]"
          on:click={() => scrollToInitial(init)}
        >
          {init}
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex items-center justify-between mb-2">
    <span class="text-[10px] uppercase tracking-wider text-[var(--text-color-70)]">
      {lang === 'en' ? 'Filter' : '筛选'}
      {#if selectedTags.length > 0}
        <span class="text-[var(--link-color)]"> · {selectedTags.length}</span>
      {/if}
    </span>
    <button
      class="px-1.5 py-0.5 text-[10px] rounded border transition-colors"
      class:bg-[var(--link-color)]={useOr}
      class:text-white={useOr}
      class:border-[var(--link-color)]={useOr}
      class:border-[var(--button-border-color)]={!useOr}
      class:text-[var(--text-color-70)]={!useOr}
      class:hover:border-[var(--link-color)]={!useOr}
      on:click={toggleOr}
    >
      {useOr ? 'OR' : 'AND'}
    </button>
  </div>

  {#if selectedTags.length > 0}
    <button
      class="mb-2 text-[11px] text-[var(--link-color)] hover:underline w-full text-left"
      on:click={clearAll}
    >
      {lang === 'en' ? 'Clear all' : '清除全部'}
    </button>
  {/if}

  <div class="max-h-[50vh] overflow-y-auto pr-1 space-y-1">
    {#each tree as node (node.dimension)}
      <div>
        <button
          class="flex items-center gap-1 w-full text-left py-1 text-xs font-semibold text-[var(--text-color)] hover:text-[var(--link-color)] transition-colors"
          on:click={() => toggleDim(node.dimension)}
        >
          <span class="text-[10px] w-3 text-center transition-transform" class:rotate-90={!collapsedDims.has(node.dimension)}>▸</span>
          <span>{node.dimension}</span>
          <span class="text-[10px] text-[var(--text-color-70)] ml-auto">({node.values.length})</span>
        </button>
        {#if !collapsedDims.has(node.dimension)}
          <div class="ml-3 space-y-0.5">
            {#each node.values as v (v.value)}
              <button
                data-init={v.initial}
                class="flex items-center gap-1 w-full text-left py-0.5 pl-1 pr-1 text-xs rounded transition-colors"
                class:bg-[var(--link-color)]={isSelected(node.dimension, v.value)}
                class:text-white={isSelected(node.dimension, v.value)}
                class:text-[var(--text-color-70)]={!isSelected(node.dimension, v.value)}
                class:hover:bg-[var(--button-hover-color)]={!isSelected(node.dimension, v.value)}
                on:click={() => toggleTag(`${node.dimension}:${v.value}`)}
              >
                <span class="w-4 text-center text-[10px] opacity-50">{v.initial}</span>
                <span class="flex-1 truncate">{v.value}</span>
                <span class="text-[10px] opacity-50">({v.count})</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
