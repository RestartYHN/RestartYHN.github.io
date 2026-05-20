<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CommentItem from './CommentItem.svelte';
	import i18nit from '../../i18n/translation.ts';
	import { previewImageStore } from './previewStore';

	const dispatch = createEventDispatcher();

	export let c: any;
	export let postSlug: string;
	export let author: string;
	export let email: string;
	export let url: string;
	export let language: string = 'zh-cn';
	export let depth: number = 0;
	export let isFlattened: boolean = false;
	export let parentAuthorName: string | null = null;
	export let parentCommentId: string | null = null;
	export let replyingToId: string | null = null;
	export let maxReplies: number = Infinity;

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

	const t = i18nit(language);

	let replyAuthor = '';
	let replyEmail = '';
	let replyUrl = '';
	let replyContent = '';
	let replySubmitting = false;
	let replyArea: HTMLTextAreaElement | null = null;

	let showAllReplies = false;

	function countAllReplies(replies: any[]): number {
		if (!replies) return 0;
		let count = replies.length;
		for (const r of replies) {
			if (r.replies) count += countAllReplies(r.replies);
		}
		return count;
	}

	$: totalReplies = countAllReplies(c?.replies);
	$: hasMoreReplies = depth === 0 && totalReplies > 3;
	$: effectiveMax = depth === 0 ? (showAllReplies ? Infinity : 3) : maxReplies;
	$: limitedReplies = (c?.replies || []).slice(0, effectiveMax);

	// 图片上传
	let replyUploadingImage = false;
	let replyFileInput: HTMLInputElement;

	function replyHandlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) replyUploadAndInsert(file);
				return;
			}
		}
	}

	function replyHandleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			replyUploadAndInsert(file);
			target.value = '';
		}
	}

	async function replyUploadAndInsert(file: File) {
		replyUploadingImage = true;
		const formData = new FormData();
		formData.append('file', file);
		try {
			const importSiteConfig = (await import('@/config')).siteConfig;
			const apiUrl = importSiteConfig.comments.backendUrl;
			const res = await fetch(`${apiUrl}/api/upload`, {
				method: 'POST',
				body: formData
			});
			const data = await res.json();
			if (data.url) {
				replyContent += (replyContent ? '\n' : '') + `![${file.name}](${data.url})`;
			} else {
				alert('上传失败: ' + (data.message || '未知错误'));
			}
		} catch (err: any) {
			alert('图片上传失败: ' + (err.message || err));
		} finally {
			replyUploadingImage = false;
		}
	}

	let reactions: Record<string, number> = c?.reactions || {};
	let myReactions: string[] = c?.myReactions || [];
	let reactPending = false;

  let showReactions = false;
  let likeCount = c?.likeCount || 0;
  let likedByMe = c?.likedByMe || false;
  let likePending = false;

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
  $: hasAnyReaction = REACT_TYPES.some(rt => (reactions[rt.key] || 0) > 0);

  async function toggleLike() {
    if (likePending) return;
    likePending = true;
    const wasLiked = likedByMe;
    likedByMe = !wasLiked;
    likeCount += likedByMe ? 1 : -1;
    try {
      const { siteConfig } = await import('@/config');
      await fetch(`${siteConfig.comments.backendUrl}/api/comments/${c.id}/${wasLiked ? 'unlike' : 'like'}`, { method: 'POST' });
    } catch {
      likedByMe = wasLiked;
      likeCount += wasLiked ? 1 : -1;
    } finally {
      likePending = false;
    }
  }

  async function toggleReaction(type: string) {
		if (reactPending) return;
		reactPending = true;
		const had = myReactions.includes(type);
		if (had) {
			myReactions = myReactions.filter(r => r !== type);
			reactions[type] = Math.max(0, (reactions[type] || 1) - 1);
		} else {
			myReactions = [...myReactions, type];
			reactions[type] = (reactions[type] || 0) + 1;
		}
		try {
			const { siteConfig } = await import('@/config');
			await fetch(`${siteConfig.comments.backendUrl}/api/comments/${c.id}/react`, {
				method: had ? 'DELETE' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reaction_type: type })
			});
		} catch {
			if (had) {
				myReactions = [...myReactions, type];
				reactions[type] = (reactions[type] || 0) + 1;
			} else {
				myReactions = myReactions.filter(r => r !== type);
				reactions[type] = Math.max(0, (reactions[type] || 1) - 1);
			}
		} finally {
			reactPending = false;
		}
	}

	function formatFullDate(d: Date, lang: string) {
		try {
			return new Intl.DateTimeFormat(lang?.replace('_', '-') || 'en-US', {
				year: 'numeric', month: 'short', day: 'numeric',
				hour: '2-digit', minute: '2-digit'
			}).format(d);
		} catch { return d.toLocaleString(); }
	}

	function isValidHtml(s: string) {
		return /<[a-z][\s\S]*>/i.test(s);
	}

	function isContentWithinLimit(content: string) {
		if (!content) return true;
		return content.length < 4000;
	}

	// 导出给外部调用（例如 fallback 注入器）
	export function insertEmojiReply(emoji: string) {
		if (replyArea) {
			const start = replyArea.selectionStart || 0;
			const end = replyArea.selectionEnd || 0;
			const val = replyArea.value || '';
			const next = val.slice(0, start) + emoji + val.slice(end);
			replyArea.value = next;
			replyContent = next;
			replyArea.focus();
			const pos = start + emoji.length;
			replyArea.setSelectionRange(pos, pos);
		}
	}

	const avatarUrl = c?.avatar ?? '/favicon/android-chrome-192x192.png';

	// 拍平回复树用于移动端展示
	function flattenRepliesWithParent(replies: any[], pName: string, pId: any): any[] {
		if (!replies || !replies.length) return [];
		let res: any[] = [];
		for (const r of replies) {
			res.push({ ...r, _parentName: pName, _parentId: pId });
			if (r.replies && r.replies.length > 0) {
				res = res.concat(flattenRepliesWithParent(r.replies, r.author, r.id));
			}
		}
		return res;
	}

	$: mobileFlattenedReplies = (depth === 0 && c?.replies)
		? flattenRepliesWithParent(c.replies, c.author, c.id).sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime())
		: [	];

	function handleContentClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const spoiler = target.closest('.spoiler');
		if (spoiler) {
			spoiler.classList.toggle('revealed');
			return;
		}
		if (target.tagName === 'IMG') {
			$previewImageStore = (target as HTMLImageElement).src;
		}
	}
</script>

<div id="comment-{c.id}" data-aos="fade-up" class="flex gap-2 md:gap-3 w-full max-w-full">
	{#if c.url}
	<a href={c.url} target="_blank" class="w-10 h-10 shrink-0">
		<img src={avatarUrl} alt="avatar" class="w-10 h-10 rounded-full object-cover"/>
	</a>
	{:else}
	<img src={avatarUrl} alt="avatar" class="w-10 h-10 rounded-full object-cover shrink-0"/>
	{/if}

	<div class="flex-1 min-w-0">
		<div class="flex items-center flex-wrap gap-x-2 gap-y-1">
			{#if c.url}
				<a href={c.url} target="_blank" class="font-semibold text-[var(--text-color)] hover:text-[var(--link-color)] transition-colors">{c.author}</a>
			{:else}
				<span class="font-semibold text-[var(--text-color)]">{c.author}</span>
			{/if}
			{#if c.parentId && c.parentAuthor}
				<span class="text-xs text-[var(--text-color)]/50">{t('comments.reply') || '回复'}</span>
				<a href="#comment-{c.parentId}" class="text-xs text-[var(--link-color)] hover:underline">{c.parentAuthor}</a>
			{/if}
			<span class="text-sm text-[var(--text-color-70)]">{formatFullDate(new Date(c.pubDate), language)}</span>
		</div>

		<div class="text-[var(--text-color)] mt-1 leading-relaxed w-full max-w-full min-w-0 text-sm" on:click={handleContentClick}>
			{#if c.contentHtml && typeof c.contentHtml === 'string' && isValidHtml(c.contentHtml)}
				<div class="break-words w-full max-w-full comment-content">{@html applyMarkdownEnhancements(c.contentHtml)}</div>
			{:else if c.contentText && typeof c.contentText === 'string' && c.contentText.trim() !== ''}
				<p class="break-words whitespace-pre-wrap overflow-hidden w-full max-w-full min-w-0">{c.contentText}</p>
			{:else}
				<p class="break-words whitespace-pre-wrap overflow-hidden w-full max-w-full min-w-0 text-gray-500">{t('comments.noContent') || '评论内容为空'}</p>
			{/if}
		</div>

		<div class="mt-1 flex items-center gap-3 text-sm text-[var(--text-color-70)]">
			<button on:click={() => dispatch('reply', c.id)} class="hover:text-[var(--link-color)]">回复</button>
			<button on:click={toggleLike} disabled={likePending} class="hover:text-[var(--link-color)] disabled:opacity-50" title={likedByMe ? '取消赞' : '点赞'}>
				<span class={likedByMe ? 'text-[var(--link-color)]' : ''}>{likedByMe ? '♥' : '♡'}</span>
				<span class="ml-0.5 text-xs">{likeCount || ''}</span>
			</button>
			<div class="flex items-center gap-0.5 flex-wrap">
			<button on:click={() => showReactions = !showReactions}
				class="w-6 h-6 rounded-full bg-[var(--bg-color)] border border-[var(--button-border-color)] flex items-center justify-center text-xs hover:bg-[var(--button-hover-color)] transition-colors flex-shrink-0"
				title="表情">
				😊
			</button>
			{#each REACT_TYPES as rt}
				{@const cnt = reactions[rt.key] || 0}
				{#if cnt > 0}
					<button on:click={() => toggleReaction(rt.key)} disabled={reactPending}
						class="text-xs hover:bg-[var(--button-hover-color)] rounded px-1 py-0.5 disabled:opacity-50 transition-colors flex-shrink-0"
						class:font-bold={myReactions.includes(rt.key)}
						class:text-[var(--link-color)]={myReactions.includes(rt.key)}>
						{rt.key} {cnt}
					</button>
				{/if}
			{/each}
			</div>
		</div>
		{#if showReactions}
		<div class="mt-1 grid grid-cols-5 gap-1 text-xs">
			{#each REACT_TYPES as rt}
				{@const cnt = reactions[rt.key] || 0}
				<button on:click={() => toggleReaction(rt.key)} disabled={reactPending}
					class="px-1.5 py-0.5 rounded hover:bg-[var(--button-hover-color)] disabled:opacity-50 transition-colors text-center"
					class:font-bold={myReactions.includes(rt.key)}
					class:text-[var(--link-color)]={myReactions.includes(rt.key)}>
					{rt.key} {cnt > 0 ? cnt : ''}
				</button>
			{/each}
		</div>
		{/if}

		{#if replyingToId === c.id}
			<div class="mt-4 pl-4 border-l-2 border-gray-200">
				<form on:submit|preventDefault={() => {
					if (replySubmitting) return;
					if (!replyAuthor || !replyEmail || !replyContent) { alert(t('comments.fillRequired') || '请填写昵称、邮箱和评论内容'); return; }
					if (!isContentWithinLimit(replyContent)) { alert(t('comments.contentTooLong') || '评论内容超出限制'); return; }
					replySubmitting = true;
					dispatch('submit', { parentId: c.id, author: replyAuthor, email: replyEmail, url: replyUrl, content: replyContent, post_url: window.location.href });
					replyContent = '';
				}} class="space-y-3">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
						<div>
							<label for="reply-author-{c.id}" class="block text-xs text-[var(--text-color)] mb-1">{t('comments.name')}<span class="text-red-500">*</span></label>
							<input id="reply-author-{c.id}" type="text" placeholder={t('comments.required')} bind:value={replyAuthor} class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm py-1 px-2" />
						</div>
						<div>
							<label for="reply-email-{c.id}" class="block text-xs text-[var(--text-color)] mb-1">{t('comments.email')}<span class="text-red-500">*</span></label>
							<input id="reply-email-{c.id}" type="email" placeholder={t('comments.required')} bind:value={replyEmail} class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm py-1 px-2" />
						</div>
						<div>
							<label for="reply-url-{c.id}" class="block text-xs text-[var(--text-color)] mb-1">{t('comments.site')}</label>
							<input id="reply-url-{c.id}" type="url" placeholder={t('comments.optional')} bind:value={replyUrl} class="rounded w-full text-[var(--text-color)] border border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm py-1 px-2" />
						</div>
					</div>

					<div>
						<textarea placeholder={t('comments.replyPlaceholder') || "写下你的回复..."} class="rounded w-full border text-[var(--text-color)] border-[var(--button-border-color)] focus:outline-none focus:border-[var(--link-color)] text-sm p-2 min-h-[80px]" on:paste={replyHandlePaste} bind:value={replyContent} bind:this={replyArea}></textarea>
						<div class="flex justify-between items-center mt-1">
							<div>
								<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" bind:this={replyFileInput} on:change={replyHandleFileSelect} />
								<button type="button" on:click={() => replyFileInput?.click()} disabled={replyUploadingImage}
									class="text-xs text-[var(--text-color)] inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] hover:text-[var(--link-color)] transition-colors">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
									{replyUploadingImage ? '上传中...' : '图片'}
								</button>
							</div>{#if !isContentWithinLimit(replyContent)}<span class="text-red-500 ml-2">{t('comments.contentTooLong') || '内容超出限制'}</span>{/if}</div>
					</div>

					<div class="flex justify-end gap-2 items-center">
						<button type="button" on:click={() => { dispatch('cancel'); replySubmitting = false; }} class="rounded px-3 py-1 text-sm text-[var(--text-color)] border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)]">{t('comments.cancel')}</button>
						<button type="submit" disabled={replySubmitting || !isContentWithinLimit(replyContent)} class="rounded px-3 py-1 text-sm font-medium text-[var(--text-color)] border border-[var(--button-border-color)] hover:bg-[var(--button-hover-color)] disabled:opacity-50">{replySubmitting ? t('comments.sending') : t('comments.reply')}</button>
					</div>
				</form>
			</div>
		{/if}

		{#if depth < 1 && totalReplies > 0}
		<div class="border-l border-[var(--text-color)]/50 space-y-3 w-full pl-2 md:pl-3">
			{#each limitedReplies as reply, i}
				<div class="w-full max-w-full overflow-hidden mt-4">
					<CommentItem c={reply} {postSlug} {author} {email} {url} {language} depth={depth + 1} isFlattened={false} maxReplies={effectiveMax - i - 1} on:reply={(e) => dispatch('reply', e.detail)} on:submit={(e) => dispatch('submit', e.detail)} on:cancel={() => dispatch('cancel')} replyingToId={replyingToId} />
				</div>
			{/each}
			{#if hasMoreReplies}
			<button on:click={() => showAllReplies = !showAllReplies} class="text-xs text-[var(--link-color)] hover:underline mt-2">
				{showAllReplies ? '收起' : `展开全部 ${totalReplies} 条回复`}
			</button>
			{/if}
		</div>
		{/if}
	</div>
</div>
{#if depth >= 1 && limitedReplies.length > 0}
<div class="space-y-3 w-full">
	{#each limitedReplies as reply, i}
		<CommentItem c={reply} {postSlug} {author} {email} {url} {language} depth={depth + 1} isFlattened={false} maxReplies={effectiveMax - i - 1} on:reply={(e) => dispatch('reply', e.detail)} on:submit={(e) => dispatch('submit', e.detail)} on:cancel={() => dispatch('cancel')} replyingToId={replyingToId} />
	{/each}
</div>
{/if}

<style>
	.comment-content :global(img) {
		max-width: 100%;
		max-height: 200px;
		object-fit: contain;
		border-radius: 4px;
		cursor: zoom-in;
		margin: 4px 0;
	}

	.comment-content :global(img[src*="/emoji"]) {
		height: 24px;
		width: auto;
		display: inline;
		vertical-align: middle;
		margin: 0 1px;
		border-radius: 0;
		cursor: default;
		max-height: 24px;
		object-fit: contain;
	}
</style>