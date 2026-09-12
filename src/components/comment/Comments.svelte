<script lang="ts">
  import { onMount } from 'svelte';
  import { siteConfig } from '@/config.ts';
  import CommentItem from './CommentItem.svelte';
  import i18nit from '../../i18n/translation.ts';
  import { openPicker } from './emojiPickerStore';
  import EmojiPicker from './EmojiPicker.svelte';
  import { previewImageStore } from './previewStore';
  import { parseMarkdown } from '@utils/markdown';
  import { createLightbox, type LightboxHandle } from '@/lib/ui/lightbox';

  let lightbox: LightboxHandle | null = null;

  onMount(() => {
    const unsub = previewImageStore.subscribe(url => {
      if (url) {
        if (url.includes('/emoji')) return;
        if (lightbox) return;
        const imgs = Array.from(document.querySelectorAll('.comment-content img'))
          .filter((el): el is HTMLImageElement => !el.src.includes('/emoji'))
          .map((el) => el.src);
        let currentIndex = imgs.indexOf(url);
        if (currentIndex === -1) currentIndex = 0;
        lightbox = createLightbox({
          getImages: () => imgs,
          startIndex: currentIndex,
          variant: 'comment',
          zoomControls: true,
          touchDrag: true,
          lockScroll: true,
          mount: document.body,
          onClose: () => previewImageStore.set(null),
        });
      } else if (lightbox) {
        lightbox.close();
        lightbox = null;
      }
    });
    return () => unsub();
  });

  export let postSlug: string;
  export let language: string = 'zh-cn';
  export let postTitle: string;
  export let qaMode: boolean = false;
  export let hideForm: boolean = false;

  const t = i18nit(language);

  const apiUrl = siteConfig.comments.backendUrl;

  let comments: any[] = [];
  let loading = true;
  let error = '';
  let page = 1;
  let limit = 5;
  let totalPage = 1;
  let totalCount = 0;
  let hasMore = false;
  let sortBy: 'time' | 'likes' = 'time';

  // 顶层评论表单数据
  let author = '';
  let email = '';
  let url = '';
  let content = '';
  let contentArea: HTMLTextAreaElement | null = null;
  let showPreview = false;
  let previewHtml = '';

  function togglePreview() {
    if (!showPreview) {
      previewHtml = parseMarkdown(content);
    }
    showPreview = !showPreview;
  }

  // 图片上传
  let uploadingImage = false;
  let fileInput: HTMLInputElement;

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadAndInsert(file);
        return;
      }
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      uploadAndInsert(file);
      target.value = '';
    }
  }

  async function uploadAndInsert(file: File) {
    uploadingImage = true;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        content += (content ? '\n' : '') + `![${file.name}](${data.url})`;
      } else {
        alert('上传失败: ' + (data.message || '未知错误'));
      }
    } catch (err: any) {
      alert('图片上传失败: ' + (err.message || err));
    } finally {
      uploadingImage = false;
    }
  }

  // 防止重复提交
  let submitting = false;

  // 当前正在回复的评论ID
  let replyingToId: number | null = null;

  // 本地存储键名
  const STORAGE_KEY = 'comment_user_info';

  // 从本地存储加载用户信息
  function loadUserInfoFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userInfo = JSON.parse(stored);
        author = userInfo.author || '';
        email = userInfo.email || '';
        url = userInfo.url || '';
      }
    } catch (e) {
      console.warn('Failed to load user info from localStorage:', e);
    }
  }

  // 保存用户信息到本地存储
  function saveUserInfoToStorage() {
    try {
      const userInfo = { author, email, url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    } catch (e) {
      console.warn('Failed to save user info to localStorage:', e);
    }
  }

  // 计算内容字数
  function getWordCount(text: string): { chars: number; words: number } {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { chars, words };
  }

  // 检查字数是否超出限制
  function isContentWithinLimit(text: string): boolean {
    const { chars, words } = getWordCount(text);
    return chars <= 2000 && words <= 1000;
  }

  async function loadComments() {
    loading = true;
    try {
      const res = await fetch(
        `${apiUrl}/api/comments?post_slug=${encodeURIComponent(postSlug)}&nested=true&page=${page}&limit=${limit}&sort_by=${sortBy}`
      );
      if (!res.ok) throw new Error(t('comments.loadFailed') || '加载失败');
      const data = await res.json();
      // 先取原始评论列表
      let loaded = data.data.comments;
      comments = loaded;
      totalPage = data.data.pagination.totalPage;
      totalCount = data.data.pagination.totalCount || 0;
      hasMore = data.data.pagination.totalPage > page;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

    async function submitComment(parentId: number | null = null, replyData: any = null) {
    // 防止重复提交
    if (submitting) return false;

    let submitAuthor: string, submitEmail: string, submitUrl: string, submitContent: string;

    if (replyData) {
      submitAuthor = replyData.author;
      submitEmail = replyData.email;
      submitUrl = replyData.url;
      submitContent = replyData.content;
    } else {
      submitAuthor = author;
      submitEmail = email;
      submitUrl = url;
      submitContent = content;
    }

    if (!submitAuthor || !submitEmail || !submitContent) {
      alert(t('comments.fillRequired') || '请填写昵称、邮箱和评论内容');
      return false;
    }

    if (!isContentWithinLimit(submitContent)) {
      alert(t('comments.contentTooLong') || '评论内容超出限制：不超过2000汉字或1000单词');
      return false;
    }

    if (!parentId) {
      submitting = true;
    }

    try {
      const res = await fetch(`${apiUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_slug: postSlug,
          author: submitAuthor,
          email: submitEmail,
          url: submitUrl || null,
          content: submitContent,
          parent_id: parentId,
          post_url: window.location.href,
          post_title: postTitle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || t('comments.submitFailed') || '提交失败，请稍后再试');
        return false;
      }
      alert(data.message || t('comments.submitSuccess') || '提交成功');

      // 只有成功后才清空表单，失败时保留用户输入
      if (!replyData) {
        content = '';
        saveUserInfoToStorage();
      }
      replyingToId = null;
      await loadComments();
      return true;
    } catch (err) {
      alert(t('comments.submitFailed') || '提交失败，请稍后再试');
      return false;
    } finally {
      if (!parentId) {
        submitting = false;
      }
    }
  }

  // 删除评论后的处理函数
  async function handleCommentDelete(_e: CustomEvent) {
    // 重新加载评论以反映删除
    await loadComments();
  }

  function setReplyingTo(id: number | null) {
    replyingToId = id;
  }

  onMount(() => {
    loadUserInfoFromStorage();
    loadComments();
  });


  function insertEmojiToTextarea(ta: HTMLTextAreaElement, emoji: string) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.value = ta.value.slice(0, start) + emoji + ta.value.slice(end);
    const pos = start + emoji.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
</script>

<div class="mt-4 max-w-3xl mx-auto border-t border-[var(--button-border-color)]" id="comments">
  <!-- <div class="my-6 border border-[var(--text-color)]/70"></div> -->
  <!-- 评论输入 -->
  <div data-aos="fade-up" class="mt-4">
    {#if !hideForm}
    <form on:submit|preventDefault={() => submitComment()} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="">
          <label for="author" class="comment-label">{t('comments.name')}<span class="text-red-500">*</span></label>
          <input id="author" type="text" placeholder={t('comments.required')} bind:value={author}
            class="comment-input" />
        </div>
        <div class="">
          <label for="email" class="comment-label">{t('comments.email')}<span class="text-red-500">*</span></label>
          <input id="email" type="email" placeholder={t('comments.required')} bind:value={email}
            class="comment-input" />
        </div>
        <div class="">
          <label for="url" class="comment-label">{t('comments.site')}</label>
          <input id="url" type="url" placeholder={t('comments.optional')} bind:value={url}
            class="comment-input" />
        </div>
      </div>

      <div>
        {#if showPreview}
          <div class="rounded border text-[var(--text-color)] border-[var(--button-border-color)] p-3 min-h-[100px] text-sm leading-relaxed comment-preview">
            {#if content.trim() === ''}
              <p class="text-[var(--text-color)]/40">{t('comments.preview') || '预览'}</p>
            {:else}
              <div>{@html previewHtml}</div>
            {/if}
          </div>
        {:else}
        <textarea placeholder={t('comments.welcome')}
          class="comment-input"
          on:paste={handlePaste}
          on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
          bind:value={content} bind:this={contentArea}></textarea>
        {/if}
        <div class="flex justify-between items-center mt-1">
          <div class="flex items-center gap-2">
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />
            <button type="button" on:click={() => fileInput?.click()} disabled={uploadingImage}
              class="comment-btn comment-btn--tool">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {uploadingImage ? (t('comments.uploadingImage') || '上传中...') : (t('comments.image') || '图片')}
            </button>
            <button type="button" id="top-emoji-btn"
              class="comment-btn comment-btn--tool"
              on:click={(e) => { e.preventDefault(); openPicker((emoji, target) => insertEmojiToTextarea(contentArea!, emoji), contentArea); }}>
               {t('comments.emoji') || '表情'}
            </button>
          </div>
          <!-- {getWordCount(content).chars} {t('comments.characters')} / {getWordCount(content).words} {t('comments.words')} -->
          {#if !isContentWithinLimit(content)}
            <span class="text-red-500 ml-2">{t('comments.contentTooLong') || '内容超出限制'}</span>
          {/if}
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" on:click={togglePreview}
          class="comment-btn comment-btn--md">
          {showPreview ? t('comments.write') || '撰写' : t('comments.preview') || '预览'}
        </button>
        <button type="submit" disabled={submitting || !isContentWithinLimit(content)}
          class="comment-btn comment-btn--md">
          {submitting ? t('comments.sending') : t('comments.send')}
        </button>
      </div>
    </form>
    {/if}
  </div>

  <div class="my-6 border-t border-[var(--button-border-color)]" id="comments-divider"></div>

  <!-- 评论区 -->
  <div class="" id="comments-content">
    {#if loading}
      <p data-aos="fade-up" class="text-[var(--text-color)] text-center">{qaMode ? t('qa.loading') : (t('comments.loading') || '正在加载评论...')}</p>
    {:else if error}
      <p data-aos="fade-up" class="text-red-500 text-center">{t('comments.loadFailed') || '加载失败：'}{error}</p>
    {:else}
      <h4 data-aos="fade-up" class="text-[var(--text-color)] text-base font-semibold mb-4 flex items-center gap-2">
        {totalCount || comments.length} {qaMode ? t('qa.total') : t('comments.comments')}
        {#if !qaMode}
        <div class="ml-auto flex items-center gap-0 text-xs border border-[var(--button-border-color)] rounded overflow-hidden">
          <button on:click={() => { if (sortBy !== 'time') { sortBy = 'time'; page = 1; loadComments(); } }}
            class="px-2.5 py-1 transition-colors {sortBy === 'time' ? 'bg-[var(--link-color)] text-white' : 'bg-transparent text-[var(--text-color)] hover:bg-[var(--button-hover-color)]'}">
            {t('comments.sortByTime') || '按时间'}
          </button>
          <button on:click={() => { if (sortBy !== 'likes') { sortBy = 'likes'; page = 1; loadComments(); } }}
            class="px-2.5 py-1 border-l border-[var(--button-border-color)] transition-colors {sortBy === 'likes' ? 'bg-[var(--link-color)] text-white' : 'bg-transparent text-[var(--text-color)] hover:bg-[var(--button-hover-color)]'}">
            {t('comments.sortByLikes') || '按点赞'}
          </button>
        </div>
        {/if}
      </h4>

      {#each comments.filter(c => c.pinned) as c}
         <div class="pinned-comment mb-4 border-l-[3px] border-[var(--link-color)] pl-3">
          <CommentItem {c} {postSlug} {author} {email} {url} {language} {qaMode}
            on:reply={(e) => setReplyingTo(e.detail)} 
            on:cancel={() => setReplyingTo(null)}
            onSubmit={async (p) => submitComment(p.parentId, p)}
            on:delete={handleCommentDelete}
            replyingToId={replyingToId} />
        </div>
      {/each}

      <div class="space-y-6">
        {#each comments.filter(c => !c.pinned) as c}
          <CommentItem {c} {postSlug} {author} {email} {url} {language} {qaMode}
            on:reply={(e) => setReplyingTo(e.detail)} 
            on:cancel={() => setReplyingTo(null)}
            onSubmit={async (p) => submitComment(p.parentId, p)}
            on:delete={handleCommentDelete}
            replyingToId={replyingToId} />
        {/each}
      </div>

      {#if totalPage > 1}
        <div data-aos="fade-up" class="flex justify-center items-center gap-1 mt-6">
          <button on:click={() => { if (page > 1) { page--; loadComments(); } }} disabled={page <= 1}
            class="comment-page-btn">‹</button>
          {#each Array(totalPage) as _, i}
            <button on:click={() => { page = i + 1; loadComments(); }}
              class="comment-page-btn" class:is-active={page === i + 1}>{i + 1}</button>
          {/each}
          <button on:click={() => { if (page < totalPage) { page++; loadComments(); } }} disabled={page >= totalPage}
            class="comment-page-btn">›</button>
        </div>
      {/if}
    {/if}
  </div>
  <EmojiPicker {language} />
</div>

