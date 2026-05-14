<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import i18nit from '@i18n/translation';
  import { formatMonthDay } from '@/utils/time'
  import { getRelativeLocaleUrl } from '@utils/url-utils';
  import { pinyin } from 'pinyin-pro';

  export let sortedPosts = [];
  export let currentLang = "zh-cn";
  export let defaultLocale = "zh-cn";
  export let baseUrl = "/blog/";
  export let subTitle = "";

  let selectedCategories: string[] = [];
  let useOr = false;
  const t = i18nit(currentLang);

  $: flatCategories = [...new Set(sortedPosts.flatMap(p => p.data?.categories || []))].sort((a, b) => a.localeCompare(b, 'zh-u-co-pinyin'));

  function parseTag(tag: string): [string, string] {
    const idx = tag.indexOf(':');
    if (idx === -1) return ['', tag];
    return [tag.slice(0, idx), tag.slice(idx + 1)];
  }

  function getInitial(tag: string): string {
    const [, val] = parseTag(tag);
    const ch = val.charAt(0);
    if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
    if (/[0-9]/.test(ch)) return '#';
    if (/[\u4e00-\u9fff]/.test(ch)) {
      const py = pinyin(ch, { pattern: 'first', toneType: 'none' });
      return py ? py.toUpperCase() : '#';
    }
    return '#';
  }

  let expandedDims = new Set<string>();
  let expandedLetters = new Set<string>();

  $: dimGroups = (() => {
    const map = new Map<string, Map<string, Set<string>>>();
    const fallback = currentLang === 'en' ? 'Other' : '其他';
    for (const tag of flatCategories) {
      const [dim, val] = parseTag(tag);
      const d = dim || fallback;
      const init = getInitial(val);
      if (!map.has(d)) map.set(d, new Map());
      const dm = map.get(d)!;
      if (!dm.has(init)) dm.set(init, new Set());
      dm.get(init)!.add(val);
    }
    const result: { dim: string; letters: { key: string; values: { val: string; full: string }[] }[] }[] = [];
    for (const [dim, dm] of map) {
      const letters: { key: string; values: { val: string; full: string }[] }[] = [];
      for (const [key, vals] of dm) {
        const values = Array.from(vals).map(val => ({
          val,
          full: dim === fallback ? val : `${dim}:${val}`,
        }));
        values.sort((a, b) => a.val.localeCompare(b.val, 'zh-u-co-pinyin'));
        letters.push({ key, values });
      }
      letters.sort((a, b) => a.key.localeCompare(b.key));
      result.push({ dim, letters });
    }
    result.sort((a, b) => a.dim.localeCompare(b.dim, 'zh-u-co-pinyin'));
    return result;
  })();

  $: {
    const small = new Set<string>();
    for (const g of dimGroups) {
      for (const l of g.letters) {
        if (l.values.length <= 3) small.add(`${g.dim}:${l.key}`);
      }
    }
    expandedLetters = small;
  }

  $: filteredPosts = selectedCategories.length > 0
    ? sortedPosts.filter(post => {
        const postTags = post.data?.categories || [];
        return useOr
          ? selectedCategories.some(t => postTags.includes(t))
          : selectedCategories.every(t => postTags.includes(t));
      })
    : sortedPosts;

  $: postsByYear = filteredPosts.reduce((acc, post) => {
    const year = new Date(post.data.pubDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  $: years = Object.keys(postsByYear).sort((a, b) => b - a);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    if (catParam) selectedCategories = catParam.split(',');

    const orParam = params.get('mode');
    if (orParam === 'or') useOr = true;

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      selectedCategories = p.get('category')?.split(',') || [];
      useOr = p.get('mode') === 'or';
    };
    window.addEventListener('popstate', handlePopState);

    const syncAsideHeight = () => {
      const mainContent = document.getElementById('archive-content');
      const aside = document.getElementById('category-sidebar');
      if (mainContent && aside) aside.style.height = `${mainContent.offsetHeight}px`;
    };
    setTimeout(syncAsideHeight, 0);
    let resizeTimer: any;
    const handleResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(syncAsideHeight, 100); };
    window.addEventListener('resize', handleResize);
    const mainContent = document.getElementById('archive-content');
    let mutationObserver: MutationObserver | null = null;
    if (mainContent) {
      mutationObserver = new MutationObserver(syncAsideHeight);
      mutationObserver.observe(mainContent, { childList: true, subtree: true, attributes: false, characterData: false });
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      if (mutationObserver) mutationObserver.disconnect();
    }
  });

  function toggleCategory(cat: string | null) {
    if (cat === null) { selectedCategories = []; }
    else if (selectedCategories.includes(cat)) { selectedCategories = selectedCategories.filter(c => c !== cat); }
    else { selectedCategories = [...selectedCategories, cat]; }
    const url = new URL(window.location);
    if (selectedCategories.length > 0) {
      url.searchParams.set('category', selectedCategories.join(','));
      url.searchParams.set('mode', useOr ? 'or' : 'and');
    } else {
      url.searchParams.delete('category');
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url);
  }
</script>

<div class="archives mx-auto w-full max-w-[var(--page-width)]">
    <div class="text-center pt-5 pb-10 max-w-[var(--page-width)] mx-auto md:mt-0 mt-28">
        <p class="text-[var(--text-color)] text-3xl py-5 font-bold">{t("header.archive")}</p>
        <p class="text-[var(--text-color-70)] font-bold">{subTitle || t("cover.subTitle.archive", {count: filteredPosts.length})}</p>
    </div>

    {#if flatCategories.length > 0}
    <details class="lg:hidden mb-6 border border-[var(--button-border-color)] rounded-xl p-3" id="archive-tag-filter-mobile">
        <summary class="flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] cursor-pointer select-none">
            <span>{t("category")}</span>
            <span id="selected-count-mobile" class="text-xs font-normal text-[var(--text-color-70)] hidden"></span>
            <button class="ml-auto px-1.5 py-0.5 text-[11px] rounded border transition-colors border-[var(--button-border-color)] text-[var(--text-color-70)]"
                class:bg-[var(--link-color)]={useOr}
                class:text-white={useOr}
                class:border-[var(--link-color)]={useOr}
                on:click|preventDefault={() => { useOr = !useOr; toggleCategory(null); }}
            >
                {useOr ? 'OR' : 'AND'}
            </button>
        </summary>
        <div class="mt-2">
            <button
                class="mb-1 px-3 py-1 text-xs rounded-md border transition-all w-full text-left {selectedCategories.length === 0 ? 'bg-[var(--link-color)] text-white border-[var(--link-color)]' : 'hover:border-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color)]'}"
                on:click={() => toggleCategory(null)}
            >
                {currentLang === 'en' ? 'All' : '全部'}
            </button>
            <div class="space-y-1">
                {#each dimGroups as group (group.dim)}
                    <div>
                        <button
                            class="flex items-center gap-1 w-full text-left py-1 text-xs font-semibold text-[var(--text-color)] hover:text-[var(--link-color)] transition-colors"
                            on:click|preventDefault={() => { if (expandedDims.has(group.dim)) expandedDims.delete(group.dim); else expandedDims.add(group.dim); expandedDims = expandedDims; }}
                        >
                            <span class="text-[10px] w-3 text-center transition-transform" class:rotate-90={expandedDims.has(group.dim)}>▸</span>
                            <span>{group.dim}</span>
                        </button>
                        {#if expandedDims.has(group.dim)}
                            <div class="ml-3 mt-0.5">
                                {#each group.letters as l (l.key)}
                                    <div>
                                        <button
                                            class="flex items-center gap-1 w-full text-left py-0.5 text-[11px] text-[var(--text-color-70)] hover:text-[var(--link-color)] transition-colors"
                                            on:click|preventDefault={() => { const k = `${group.dim}:${l.key}`; if (expandedLetters.has(k)) expandedLetters.delete(k); else expandedLetters.add(k); expandedLetters = expandedLetters; }}
                                        >
                                            <span class="text-[9px] w-2.5 text-center transition-transform" class:rotate-90={expandedLetters.has(`${group.dim}:${l.key}`)}>▸</span>
                                            {l.key}
                                        </button>
                                        {#if expandedLetters.has(`${group.dim}:${l.key}`)}
                                            <div class="ml-3 flex flex-wrap gap-1 mb-1">
                                                {#each l.values as v (v.full)}
                                                    <button 
                                                        on:click={() => toggleCategory(v.full)}
                                                        class="px-2 py-0.5 text-xs rounded-md transition-all border
                                                        {selectedCategories.includes(v.full) 
                                                            ? 'bg-[var(--link-color)] text-white border-[var(--link-color)]' 
                                                            : 'hover:border-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color)]'}"
                                                    >
                                                        {v.val}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </details>
    {/if}

    <div class="py-6 mx-auto text-[var(--text-color)]" id="archive-content">
        {#each years as year (year)}
            <div class="mb-8">
                <h2 class="text-2xl font-bold my-4 text-[var(--text-color)] flex items-center gap-3">
                    <span class="w-1 h-6 bg-[var(--link-color)] rounded-full"></span>
                    {year}
                </h2>
                <div class="space-y-2">
                    {#each postsByYear[year] as post (post.id)}
                        <div animate:flip={{ duration: 600 }} in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} >
                            <a 
                                href={getRelativeLocaleUrl(currentLang, baseUrl + post.id)} 
                                class="flex items-center gap-4 active:bg-[var(--button-hover-color)] hover:bg-[var(--button-hover-color)] p-2 rounded transition-all duration-200 group"
                            >
                                <span class="text-[var(--text-color-70)] min-w-[80px] md:min-w-[120px]">
                                    {formatMonthDay(post.data.pubDate, currentLang)}
                                </span>
                                <span class="text-lg group-hover:pl-2 group-hover:text-[var(--link-color)] group-hover:font-bold transition-all duration-200 flex-1 group-active:text-[var(--link-color)]">
                                    {post.data.title}
                                    {#if post.isFallback}
                                        <span class="inline-block px-1 ml-2 text-xs font-mono uppercase bg-[var(--button-hover-color)] rounded border border-[var(--button-border-color)]">
                                            {defaultLocale}
                                        </span>
                                    {/if}
                                </span>
                                <span class="hidden md:flex items-center font-mono text-sm text-[var(--text-color-70)]">
                                    <Icon icon="fa6-solid:hashtag" class="mr-1" />
                                    {post.data.category || ''}
                                </span>
                            </a>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<aside 
    id="category-sidebar"
    class="hidden lg:block absolute left-[var(--toc-offset-left)] top-70 bottom-0 w-[var(--category-width)] z-10">
    <div class="sticky top-24">
        <div class="flex items-center gap-2 text-[var(--text-color)] font-bold mb-4 border-b border-[var(--button-border-color)] pb-2 uppercase tracking-wider">
            <Icon icon="fa6-solid:hashtag" class="text-xs" />
            <span>{t("category")}</span>
            <button
                class="ml-auto px-1.5 py-0.5 text-[11px] rounded border transition-colors"
                class:bg-[var(--link-color)]={useOr}
                class:text-white={useOr}
                class:border-[var(--link-color)]={useOr}
                class:border-[var(--button-border-color)]={!useOr}
                class:text-[var(--text-color-70)]={!useOr}
                class:hover:border-[var(--link-color)]={!useOr}
                on:click={() => { useOr = !useOr; toggleCategory(null); }}
            >
                {useOr ? 'OR' : 'AND'}
            </button>
        </div>
        <button
            class="mb-2 px-3 py-1 text-xs rounded-md border transition-all w-full text-left {selectedCategories.length === 0 ? 'bg-[var(--link-color)] text-white border-[var(--link-color)]' : 'hover:border-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color)]'}"
            on:click={() => toggleCategory(null)}
        >
            {currentLang === 'en' ? 'All' : '全部'} ({flatCategories.length})
        </button>
        <div class="space-y-1 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
            {#each dimGroups as group (group.dim)}
                <div>
                    <button
                        class="flex items-center gap-1 w-full text-left py-1 text-xs font-semibold text-[var(--text-color)] hover:text-[var(--link-color)] transition-colors"
                        on:click={() => { if (expandedDims.has(group.dim)) expandedDims.delete(group.dim); else expandedDims.add(group.dim); expandedDims = expandedDims; }}
                    >
                        <span class="text-[10px] w-3 text-center transition-transform" class:rotate-90={expandedDims.has(group.dim)}>▸</span>
                        <span>{group.dim}</span>
                    </button>
                    {#if expandedDims.has(group.dim)}
                        <div class="ml-3 mt-0.5">
                            {#each group.letters as l (l.key)}
                                <div>
                                    <button
                                        class="flex items-center gap-1 w-full text-left py-0.5 text-[11px] text-[var(--text-color-70)] hover:text-[var(--link-color)] transition-colors"
                                        on:click={() => { const k = `${group.dim}:${l.key}`; if (expandedLetters.has(k)) expandedLetters.delete(k); else expandedLetters.add(k); expandedLetters = expandedLetters; }}
                                    >
                                        <span class="text-[9px] w-2.5 text-center transition-transform" class:rotate-90={expandedLetters.has(`${group.dim}:${l.key}`)}>▸</span>
                                        {l.key}
                                    </button>
                                    {#if expandedLetters.has(`${group.dim}:${l.key}`)}
                                        <div class="ml-3 flex flex-wrap gap-1 mb-1">
                                            {#each l.values as v (v.full)}
                                                <button 
                                                    on:click={() => toggleCategory(v.full)}
                                                    class="px-2 py-0.5 text-xs rounded-md transition-all border
                                                    {selectedCategories.includes(v.full) 
                                                        ? 'bg-[var(--link-color)] text-white border-[var(--link-color)]' 
                                                        : 'hover:border-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color)]'}"
                                                >
                                                    {v.val}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</aside>
