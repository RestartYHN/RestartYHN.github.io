<script lang="ts">
  import { onMount } from 'svelte';
  import { siteConfig } from '@/config.ts';
  import CommentItem from './CommentItem.svelte';
  import i18nit from '../../i18n/translation.ts';
  import { openPicker } from './emojiPickerStore';
  import EmojiPicker from './EmojiPicker.svelte';
  import { previewImageStore } from './previewStore';

  let overlayEl: HTMLDivElement | null = null;

  onMount(() => {
    const unsub = previewImageStore.subscribe(url => {
      if (url && !overlayEl) {
        if (url.includes('/emoji')) return;
        document.documentElement.style.touchAction = 'none';
        const imgs = Array.from(document.querySelectorAll('.comment-content img')).filter((img: any) => !img.src.includes('/emoji')).map((img: any) => img.src);
        let currentIndex = imgs.indexOf(url);
        if(currentIndex === -1) currentIndex = 0;

        overlayEl = document.createElement('div');
        overlayEl.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center overflow-hidden';
        overlayEl.onclick = (e) => { if (e.target === overlayEl) previewImageStore.set(null); };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-4 right-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer';
        closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        closeBtn.onclick = (e) => { e.stopPropagation(); previewImageStore.set(null); };
        overlayEl.appendChild(closeBtn);

        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'absolute top-4 right-16 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-lg';
        zoomInBtn.textContent = '+';
        zoomInBtn.onclick = (e) => { e.stopPropagation(); scale = Math.min(5, scale + 0.5); updateTransform(); };
        overlayEl.appendChild(zoomInBtn);

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'absolute top-4 right-[7.5rem] z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-lg';
        zoomOutBtn.textContent = '−';
        zoomOutBtn.onclick = (e) => { e.stopPropagation(); scale = Math.max(0.5, scale - 0.5); updateTransform(); };
        overlayEl.appendChild(zoomOutBtn);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'absolute left-2 sm:left-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer shadow-md';
        prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'absolute right-2 sm:right-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer shadow-md';
        nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

        let scale = 1, posX = 0, posY = 0, dragging = false, lastX = 0, lastY = 0;

        const img = document.createElement('img');
        img.src = imgs[currentIndex];
        img.className = 'max-w-full max-h-full object-contain rounded shadow-2xl select-none';
        img.style.transition = 'transform 0.1s ease-out';
        img.style.cursor = 'grab';
        img.draggable = false;

        const updateTransform = () => {
          img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
        };
        const resetTransform = () => { scale = 1; posX = 0; posY = 0; updateTransform(); };

        const updateImage = (index: number) => {
            if(index < 0) index = imgs.length - 1;
            if(index >= imgs.length) index = 0;
            currentIndex = index;
            img.src = imgs[currentIndex];
            resetTransform();
        };

        prevBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex - 1); };
        nextBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex + 1); };
        
        if(imgs.length > 1) {
            overlayEl.appendChild(prevBtn);
            overlayEl.appendChild(nextBtn);
        }

        overlayEl.addEventListener('wheel', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          scale = Math.max(0.5, Math.min(5, scale + delta));
          updateTransform();
        }, { passive: false });

        img.addEventListener('mousedown', (e) => {
          dragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          img.style.cursor = 'grabbing';
          img.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          posX += e.clientX - lastX;
          posY += e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          updateTransform();
        });

        window.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false;
            img.style.cursor = 'grab';
            img.style.transition = 'transform 0.1s ease-out';
          }
        });

        img.addEventListener('dblclick', () => { resetTransform(); });

        let touchStartX = 0, touchStartY = 0, touchDragging = false, touchLastX = 0, touchLastY = 0;
        img.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchLastX = touchStartX;
            touchLastY = touchStartY;
            touchDragging = true;
          }
        }, { passive: true });
        img.addEventListener('touchmove', (e) => {
          if (!touchDragging || e.touches.length !== 1) return;
          e.preventDefault();
          posX += e.touches[0].clientX - touchLastX;
          posY += e.touches[0].clientY - touchLastY;
          touchLastX = e.touches[0].clientX;
          touchLastY = e.touches[0].clientY;
          updateTransform();
        }, { passive: false });
        img.addEventListener('touchend', () => { touchDragging = false; });

        overlayEl.appendChild(img);
        document.body.appendChild(overlayEl);
        const onKey = (e: KeyboardEvent) => { 
            if (e.key === 'Escape') previewImageStore.set(null); 
            if (imgs.length > 1) {
                if (e.key === 'ArrowLeft') updateImage(currentIndex - 1);
                if (e.key === 'ArrowRight') updateImage(currentIndex + 1);
            }
        };
        document.addEventListener('keydown', onKey);
        (overlayEl as any).__keyHandler = onKey;
      } else if (!url && overlayEl) {
        document.removeEventListener('keydown', (overlayEl as any).__keyHandler);
        document.documentElement.style.touchAction = '';
        overlayEl.remove();
        overlayEl = null;
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

  // 要隐藏的评论 ID 列表（本地过滤）
  const HIDDEN_COMMENT_IDS: number[] = [13, 14];

  // 递归移除指定 id 的评论及其子孙
  function removeCommentsByIds(list: any[], ids: number[]) {
    if (!list || !list.length) return [];
    return list
      .filter(c => !ids.includes(Number(c.id)))
      .map(c => ({ ...c, replies: c.replies ? removeCommentsByIds(c.replies, ids) : [] }));
  }

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
      comments = removeCommentsByIds(loaded, HIDDEN_COMMENT_IDS);
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
    if (submitting) return;
    
    let submitAuthor, submitEmail, submitUrl, submitContent;
    
    if (replyData) {
      // 处理回复评论
      submitAuthor = replyData.author;
      submitEmail = replyData.email;
      submitUrl = replyData.url;
      submitContent = replyData.content;
    } else {
      // 处理顶层评论
      submitAuthor = author;
      submitEmail = email;
      submitUrl = url;
      submitContent = content;
    }

    if (!submitAuthor || !submitEmail || !submitContent) {
      alert(t('comments.fillRequired') || '请填写昵称、邮箱和评论内容');
      return;
    }

    // 检查字数限制
    if (!isContentWithinLimit(submitContent)) {
      alert(t('comments.contentTooLong') || '评论内容超出限制：不超过2000汉字或1000单词');
      return;
    }

    // 只有在提交顶层评论时才设置 submitting 状态
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
          post_url: window.location.href, // 添加当前页面的URL
          post_title: postTitle,
        }),
      });
      const data = await res.json();
      alert(data.message || t('comments.submitSuccess') || '提交成功');
      
      // 重置表单
      if (!replyData) {
        content = '';
        // 保存用户信息到本地存储
        saveUserInfoToStorage();
      }
      replyingToId = null;
      
      // 重新加载评论
      await loadComments();
    } catch (err) {
      alert(t('comments.submitFailed') || '提交失败，请稍后再试');
    } finally {
      // 只有在提交顶层评论时才重置 submitting 状态
      if (!parentId) {
        submitting = false;
      }
    }
  }

  // 删除评论后的处理函数
  async function handleCommentDelete(e: CustomEvent) {
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

  // --- Fallback DOM injector: ensure reply forms get an emoji button even if other components fail to render ---
  function addEmojiButtonToForm(form: HTMLFormElement) {
    if (!form) return;
    if (form.querySelector('.__emoji_inject_btn')) return;
    const ta = form.querySelector('textarea');
    if (!ta) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = '__emoji_inject_btn';
    btn.textContent = '表情';
    btn.style.cssText = 'padding:2px 8px;font-size:12px;border-radius:4px;border:1px solid var(--button-border-color);background:transparent;color:var(--text-color);cursor:pointer;margin-left:8px;transition:all .15s ease';
    btn.onmouseenter = () => { btn.style.background = 'var(--button-hover-color)'; btn.style.color = 'var(--link-color)'; };
    btn.onmouseleave = () => { btn.style.background = 'transparent'; btn.style.color = 'var(--text-color)'; };
    btn.addEventListener('click', () => {
      const taEl = ta as HTMLTextAreaElement;
      // 使用统一的全局 picker（openPicker），避免与旧的 fallback portal 冲突
      openPicker((emoji: string, target?: HTMLElement | null) => {
        insertEmojiToTextarea(taEl, emoji);
      }, taEl);
    });
    // insert after the textarea
    ta.parentNode?.insertBefore(btn, ta.nextSibling);
  }

  function setupFallbackInjector() {
    // inject into existing forms
    document.querySelectorAll('#comments form').forEach((f) => addEmojiButtonToForm(f as HTMLFormElement));

    // watch for new forms (reply forms appear dynamically)
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of Array.from(m.addedNodes)) {
          if (!(n as Element).querySelector) continue;
          if ((n as Element).matches && (n as Element).matches('#comments form')) addEmojiButtonToForm(n as HTMLFormElement);
          (n as Element).querySelectorAll && (n as Element).querySelectorAll('#comments form').forEach((f) => addEmojiButtonToForm(f as HTMLFormElement));
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // start injector after mount
  onMount(() => {
    // slight delay so initial comments/rendering can run
    setTimeout(() => setupFallbackInjector(), 200);
  });

  // 使用统一的全局 picker（EmojiPicker + emojiPickerStore），避免使用旧的 fallback portal 实现。

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
          <label for="author" class="block text-sm text-[var(--text-color)] mb-1">{t('comments.name')}<span class="text-red-500">*</span></label>
          <input id="author" type="text" placeholder={t('comments.required')} bind:value={author}
            class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)]  focus:outline-none focus:border-[var(--link-color)] text-sm p-2" />
        </div>
        <div class="">
          <label for="email" class="block text-sm text-[var(--text-color)] mb-1">{t('comments.email')}<span class="text-red-500">*</span></label>
          <input id="email" type="email" placeholder={t('comments.required')} bind:value={email}
            class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)]  focus:outline-none focus:border-[var(--link-color)] text-sm p-2" />
        </div>
        <div class="">
          <label for="url" class="block text-sm text-[var(--text-color)] mb-1">{t('comments.site')}</label>
          <input id="url" type="url" placeholder={t('comments.optional')} bind:value={url}
            class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)]  focus:outline-none focus:border-[var(--link-color)] text-sm p-2" />
        </div>
      </div>

      <div>
        <textarea placeholder={t('comments.welcome')}
          class="rounded w-full border text-[var(--text-color)] border-[var(--button-border-color)]  focus:outline-none focus:border-[var(--link-color)] text-sm p-3 min-h-[100px]"
          on:paste={handlePaste}
          on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
          bind:value={content} bind:this={contentArea}></textarea>
        <!-- 顶层表单使用 fallback 注入器，不再保留原始 openPicker 按钮 -->
        <div class="flex justify-between items-center mt-1">
          <div class="flex items-center gap-2">
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />
            <button type="button" on:click={() => fileInput?.click()} disabled={uploadingImage}
              class="text-xs text-[var(--text-color)] inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] hover:text-[var(--link-color)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {uploadingImage ? '上传中...' : '图片'}
            </button>
            <button type="button" id="top-emoji-btn"
              class="__emoji_inject_btn text-xs text-[var(--text-color)] inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] hover:text-[var(--link-color)] transition-colors"
              on:click={(e) => { e.preventDefault(); openPicker((emoji, target) => insertEmojiToTextarea(contentArea!, emoji), contentArea); }}>
              表情
            </button>
          </div>
          <!-- {getWordCount(content).chars} {t('comments.characters')} / {getWordCount(content).words} {t('comments.words')} -->
          {#if !isContentWithinLimit(content)}
            <span class="text-red-500 ml-2">{t('comments.contentTooLong') || '内容超出限制'}</span>
          {/if}
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button type="submit" disabled={submitting || !isContentWithinLimit(content)}
          class="rounded px-4 py-2 text-sm font-medium text-[var(--text-color)] border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] disabled:opacity-50">
          {submitting ? t('comments.sending') : t('comments.send')}
        </button>
      </div>
    </form>
    {/if}
  </div>

  <!-- 评论区 -->
  <div class="" id="comments-content">
    {#if loading}
      <p data-aos="fade-up" class="text-[var(--text-color)] text-center">{qaMode ? '正在加载 Q&A...' : (t('comments.loading') || '正在加载评论...')}</p>
    {:else if error}
      <p data-aos="fade-up" class="text-red-500 text-center">{t('comments.loadFailed') || '加载失败：'}{error}</p>
    {:else}
      <h4 data-aos="fade-up" class="text-[var(--text-color)] text-base font-semibold mb-4 flex items-center gap-2">
        {totalCount || comments.length} {qaMode ? '条Q&A' : '条评论'}
        {#if !qaMode}
        <select bind:value={sortBy} on:change={() => { page = 1; loadComments(); }}
          class="ml-auto text-xs border border-[var(--button-border-color)] rounded px-2 py-1 bg-transparent text-[var(--text-color)]">
          <option value="time">按时间</option>
          <option value="likes">按点赞</option>
        </select>
        {/if}
      </h4>

      {#each comments.filter(c => c.pinned) as c}
        <div class="pinned-comment mb-4 border-l-[3px] border-[var(--link-color)] pl-3 bg-[var(--button-hover-color)]/50 rounded-r-lg">
          <CommentItem {c} {postSlug} {author} {email} {url} {language} {qaMode}
            on:reply={(e) => setReplyingTo(e.detail)} 
            on:cancel={() => setReplyingTo(null)}
            on:submit={async (e) => { await submitComment(e.detail.parentId, e.detail); }}
            on:delete={handleCommentDelete}
            replyingToId={replyingToId} />
        </div>
      {/each}

      <div class="space-y-6">
        {#each comments.filter(c => !c.pinned) as c}
          <CommentItem {c} {postSlug} {author} {email} {url} {language} {qaMode}
            on:reply={(e) => setReplyingTo(e.detail)} 
            on:cancel={() => setReplyingTo(null)}
            on:submit={async (e) => {
              await submitComment(e.detail.parentId, e.detail);
            }}
            on:delete={handleCommentDelete}
            replyingToId={replyingToId} />
        {/each}
      </div>

      {#if totalPage > 1}
        <div data-aos="fade-up" class="flex justify-center items-center gap-1 mt-6">
          <button on:click={() => { if (page > 1) { page--; loadComments(); } }} disabled={page <= 1}
            class="px-2 py-1 text-xs rounded border border-[var(--button-border-color)] disabled:opacity-30 hover:bg-[var(--button-hover-bg-color)]">‹</button>
          {#each Array(totalPage) as _, i}
            <button on:click={() => { page = i + 1; loadComments(); }}
              class="w-7 h-7 text-xs rounded {page === i + 1 ? 'bg-[var(--link-color)] text-white' : 'border border-[var(--button-border-color)] hover:bg-[var(--button-hover-bg-color)]'}">{i + 1}</button>
          {/each}
          <button on:click={() => { if (page < totalPage) { page++; loadComments(); } }} disabled={page >= totalPage}
            class="px-2 py-1 text-xs rounded border border-[var(--button-border-color)] disabled:opacity-30 hover:bg-[var(--button-hover-bg-color)]">›</button>
        </div>
      {/if}
    {/if}
  </div>
  <EmojiPicker />
</div>

<style>
  .__emoji_inject_btn {
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid var(--button-border-color);
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .__emoji_inject_btn:hover {
    background: var(--button-hover-color);
    color: var(--link-color);
  }
</style>
