<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import i18nit from '@i18n/translation';
  import { formatMonthDay } from '@/utils/time'
  import { getRelativeLocaleUrl } from '@utils/url-utils';
  import CategoryTree from './CategoryTree.svelte';

  export let sortedPosts = [];
  export let currentLang = "zh-cn";
  export let defaultLocale = "zh-cn";
  export let baseUrl = "/blog/";

  let selectedTags = [];
  let useOr = false;
  const t = i18nit(currentLang);

  $: allTags = [...new Set(sortedPosts.flatMap(p => p.data?.categories || []))];

  $: filteredPosts = selectedTags.length > 0
    ? sortedPosts.filter(post => {
        const postTags = post.data?.categories || [];
        return useOr
          ? selectedTags.some(t => postTags.includes(t))
          : selectedTags.every(t => postTags.includes(t));
      })
    : sortedPosts;

  // 按年份分组逻辑
  $: postsByYear = filteredPosts.reduce((acc, post) => {
    const year = new Date(post.data.pubDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  $: years = Object.keys(postsByYear).sort((a, b) => b - a);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tags');
    if (tagParam) selectedTags = tagParam.split(',');

    const orParam = params.get('mode');
    if (orParam === 'or') useOr = true;

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      selectedTags = p.get('tags')?.split(',') || [];
      useOr = p.get('mode') === 'or';
    };
    window.addEventListener('popstate', handlePopState);

    const syncAsideHeight = () => {
      const mainContent = document.getElementById('archive-content');
      const aside = document.getElementById('category-sidebar');
      
      if (mainContent && aside) {
        const mainHeight = mainContent.offsetHeight;
        aside.style.height = `${mainHeight}px`;
        
      }
    };

    // 使用 setTimeout 确保 DOM 已完全渲染（特别是异步加载内容时）
    setTimeout(syncAsideHeight, 0);

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncAsideHeight, 100);
    };
    window.addEventListener('resize', handleResize);

    const mainContent = document.getElementById('archive-content');
    let mutationObserver;
    if (mainContent) {
      mutationObserver = new MutationObserver(syncAsideHeight);
      mutationObserver.observe(mainContent, {
        childList: true,    // 监听子节点增删
        subtree: true,      // 监听后代节点
        attributes: false,  // 不需要监听属性变化（性能优化）
        characterData: false
      });
    }

    return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
        
        if (mutationObserver) {
            mutationObserver.disconnect();
        }
    }
  });

  function handleTreeChange(e: CustomEvent) {
    selectedTags = e.detail.selectedTags;
    useOr = e.detail.useOr;
    const url = new URL(window.location);
    if (selectedTags.length > 0) {
      url.searchParams.set('tags', selectedTags.join(','));
      url.searchParams.set('mode', useOr ? 'or' : 'and');
    } else {
      url.searchParams.delete('tags');
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url);
  }

</script>

<div class="archives mx-auto w-full max-w-[var(--page-width)]">
    <div class="text-center pt-5 pb-10 max-w-[var(--page-width)] mx-auto md:mt-0 mt-28">
        <p class="text-[var(--text-color)] text-3xl py-5 font-bold">{t("header.archive")}</p>
        <p class="text-[var(--text-color-70)] font-bold">{t("cover.subTitle.archive", {count: filteredPosts.length})}</p>
    </div>

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
                                    {post.data.category || t("pagecard.uncategorized")}
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
        class="hidden lg:block absolute left-[var(--toc-offset-left)] top-70 bottom-0 w-[var(--category-width)]">
        <div class="sticky top-24">
            <CategoryTree
                allTags={allTags}
                selectedTags={selectedTags}
                lang={currentLang}
                on:change={handleTreeChange}
            />
        </div>
    </aside>