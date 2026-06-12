<script lang="ts">
  import { onMount } from 'svelte';
  import { siteConfig } from '@/config.ts';
  import i18nit from '../../i18n/translation.ts';

  export let postSlug: string = 'about-qa';
  export let language: string = 'zh-cn';
  export let postTitle: string = 'Q&A';

  const t = i18nit(language);
  const apiUrl = siteConfig.comments.backendUrl;

  let items: any[] = [];
  let loading = true;
  let error = '';
  let page = 1;
  let limit = 10;
  let totalPage = 1;
  let totalCount = 0;

  let askName = '';
  let askEmail = '';
  let askContent = '';
  let askSubmitting = false;
  let askSuccess = false;
  let showForm = false;

  onMount(() => {
    const stored = localStorage.getItem('qa_user_info');
    if (stored) {
      try {
        const info = JSON.parse(stored);
        askName = info.name || '';
        askEmail = info.email || '';
      } catch {}
    }
  });

  function applyMarkdownEnhancements(html: string): string {
    if (!html) return '';
    let res = html;
    let prev = '';
    while (res !== prev) {
      prev = res;
      res = processEnhancements(res);
    }
    return res;
  }

  function processEnhancements(text: string): string {
    if (!text) return '';
    const regex = /\{(.+?)\}\((.+?)\)|!!(.+?)!!|==(.+?)==|\+\+(.+?)\+\+/g;
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        const readingText = match[2];
        if (readingText.includes('|')) {
          const baseChars = Array.from(match[1]);
          const readings = readingText.split('|');
          const maxLen = Math.max(baseChars.length, readings.length);
          let rubyHtml = '';
          for (let i = 0; i < maxLen; i++) {
            rubyHtml += `${baseChars[i] || ''}<rt>${readings[i] || ''}</rt>`;
          }
          parts.push(`<ruby>${rubyHtml}</ruby>`);
        } else {
          const baseText = processEnhancements(match[1]);
          parts.push(`<ruby>${baseText}<rt>${readingText}</rt></ruby>`);
        }
      } else if (match[3]) {
        const inner = processEnhancements(match[3]);
        parts.push(`<span class="spoiler">${inner}</span>`);
      } else if (match[4]) {
        const inner = processEnhancements(match[4]);
        parts.push(`<span class="rainbow-text">${inner}</span>`);
      } else if (match[5]) {
        const inner = processEnhancements(match[5]);
        parts.push(`<span class="underline-text">${inner}</span>`);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.join('');
  }

  function handleContentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const spoiler = target.closest('.spoiler');
    if (spoiler) {
      spoiler.classList.toggle('revealed');
    }
  }

  async function loadItems() {
    loading = true;
    try {
      const res = await fetch(
        `${apiUrl}/api/comments?post_slug=${encodeURIComponent(postSlug)}&nested=true&page=${page}&limit=${limit}&sort_by=time`
      );
      if (!res.ok) throw new Error(t('qa.loadFailed'));
      const data = await res.json();
      items = data.data.comments || [];
      totalPage = data.data.pagination.totalPage;
      totalCount = data.data.pagination.totalCount || 0;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => loadItems());

  async function submitQuestion() {
    if (askSubmitting) return;
    if (!askName || !askEmail || !askContent) {
      alert(t('qa.fillRequired'));
      return;
    }
    askSubmitting = true;
    try {
      localStorage.setItem('qa_user_info', JSON.stringify({ name: askName, email: askEmail }));
      const res = await fetch(`${apiUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_slug: postSlug,
          author: askName,
          email: askEmail,
          content: askContent,
          post_url: window.location.href,
          post_title: postTitle,
        }),
      });
      const data = await res.json();
      alert(data.message || t('qa.submitSuccess'));
      askContent = '';
      askSuccess = true;
      showForm = false;
    } catch {
      alert(t('qa.submitFailed'));
    } finally {
      askSubmitting = false;
    }
  }
</script>

<div class="qa-section mt-4 max-w-3xl mx-auto">
  <div class="flex items-center justify-between mb-4">
    <button on:click={() => showForm = !showForm} class="text-sm text-[var(--link-color)] hover:underline flex items-center gap-1">
      <span class="text-lg leading-none">{showForm ? '−' : '+'}</span>
      {t('qa.askQuestion')}
    </button>
  </div>

  {#if showForm}
  <div data-aos="fade-up" class="mb-6 p-4 rounded-lg border border-[var(--button-border-color)] bg-[var(--button-hover-color)]/30">
    <form on:submit|preventDefault={submitQuestion} class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="qa-name" class="block text-xs text-[var(--text-color)] mb-1">{t('qa.name')}<span class="text-red-500">*</span></label>
          <input id="qa-name" type="text" bind:value={askName}
            class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm p-2 bg-transparent" />
        </div>
        <div>
          <label for="qa-email" class="block text-xs text-[var(--text-color)] mb-1">{t('qa.email')}<span class="text-red-500">*</span></label>
          <input id="qa-email" type="email" bind:value={askEmail}
            class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm p-2 bg-transparent" />
        </div>
      </div>
      <div>
        <textarea bind:value={askContent} placeholder={t('qa.questionPlaceholder')} rows="3"
          class="rounded w-full border text-[var(--text-color)] border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm p-3 bg-transparent resize-y"
          on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); } }}
        ></textarea>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-[var(--text-color)]/50">{t('qa.pending')}</span>
        <button type="submit" disabled={askSubmitting}
          class="rounded px-4 py-2 text-sm font-medium text-[var(--text-color)] border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] disabled:opacity-50 transition-colors">
          {askSubmitting ? t('qa.submitting') : t('qa.submit')}
        </button>
      </div>
    </form>
    {#if askSuccess}
    <p class="text-sm text-emerald-600 dark:text-emerald-400 mt-2">{t('qa.submitSuccess')}</p>
    {/if}
  </div>
  {/if}

  {#if loading}
    <p data-aos="fade-up" class="text-[var(--text-color)] text-center text-sm">{t('qa.loading')}</p>
  {:else if error}
    <p data-aos="fade-up" class="text-red-500 text-center text-sm">{t('qa.loadFailed')}: {error}</p>
  {:else if items.length === 0}
    <p data-aos="fade-up" class="text-[var(--text-color)]/50 text-center text-sm py-8">{t('qa.empty')}</p>
  {:else}
    <h4 data-aos="fade-up" class="text-[var(--text-color)] text-sm font-semibold mb-4">
      {totalCount} {t('qa.total')}
    </h4>

    <div class="space-y-1">
      {#each items.filter((q: any) => q.pinned) as q}
        <div data-aos="fade-up" class="qa-card py-3 border-b border-[var(--button-border-color)] w-full border-l-[3px] border-[var(--link-color)] pl-3 bg-[var(--button-hover-color)]/30 rounded-r-lg">
          <div class="flex gap-3">
            <span class="font-bold text-[var(--link-color)] whitespace-nowrap flex-shrink-0 text-sm">Q：</span>
            <div class="text-[var(--text-color)] break-words w-full max-w-full comment-content text-sm" on:click={handleContentClick}>
              {#if q.contentHtml}{@html applyMarkdownEnhancements(q.contentHtml)}{:else}{q.contentText}{/if}
            </div>
          </div>
          {#if q.replies?.length > 0}
          <div class="flex gap-3 mt-2">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0 text-sm">A：</span>
            <div class="text-[var(--text-color)] break-words w-full max-w-full comment-content text-sm" on:click={handleContentClick}>
              {#if q.replies[0].contentHtml}{@html applyMarkdownEnhancements(q.replies[0].contentHtml)}{:else}{q.replies[0].contentText}{/if}
            </div>
          </div>
          {/if}
        </div>
      {/each}

      {#each items.filter((q: any) => !q.pinned) as q}
        <div data-aos="fade-up" class="qa-card py-3 border-b border-[var(--button-border-color)] w-full">
          <div class="flex gap-3">
            <span class="font-bold text-[var(--link-color)] whitespace-nowrap flex-shrink-0 text-sm">Q：</span>
            <div class="text-[var(--text-color)] break-words w-full max-w-full comment-content text-sm" on:click={handleContentClick}>
              {#if q.contentHtml}{@html applyMarkdownEnhancements(q.contentHtml)}{:else}{q.contentText}{/if}
            </div>
          </div>
          {#if q.replies?.length > 0}
          <div class="flex gap-3 mt-2">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0 text-sm">A：</span>
            <div class="text-[var(--text-color)] break-words w-full max-w-full comment-content text-sm" on:click={handleContentClick}>
              {#if q.replies[0].contentHtml}{@html applyMarkdownEnhancements(q.replies[0].contentHtml)}{:else}{q.replies[0].contentText}{/if}
            </div>
          </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if totalPage > 1}
    <div data-aos="fade-up" class="flex justify-center items-center gap-1 mt-6">
      <button on:click={() => { if (page > 1) { page--; loadItems(); } }} disabled={page <= 1}
        class="px-2 py-1 text-xs rounded border border-[var(--button-border-color)] disabled:opacity-30 hover:bg-[var(--button-hover-color)] transition-colors">‹</button>
      {#each Array(totalPage) as _, i}
        <button on:click={() => { page = i + 1; loadItems(); }}
          class="w-7 h-7 text-xs rounded {page === i + 1 ? 'bg-[var(--link-color)] text-white' : 'border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)]'}">{i + 1}</button>
      {/each}
      <button on:click={() => { if (page < totalPage) { page++; loadItems(); } }} disabled={page >= totalPage}
        class="px-2 py-1 text-xs rounded border border-[var(--button-border-color)] disabled:opacity-30 hover:bg-[var(--button-hover-color)] transition-colors">›</button>
    </div>
    {/if}
  {/if}
</div>

<style>
  .comment-content :global(img) {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
    margin: 4px 0;
  }
  .comment-content :global(.spoiler) {
    background: currentColor;
    cursor: pointer;
    transition: background 0.2s;
    border-radius: 3px;
    padding: 0 2px;
  }
  .comment-content :global(.spoiler.revealed) {
    background: transparent;
  }
</style>
