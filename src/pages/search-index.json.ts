import { getCollection } from 'astro:content'
import { loadGalleryData } from '@utils/gallery-utils'
import { friendLinkConfig, externalLinkConfig } from '@/config'
import { i18n } from 'astro:config/client'

interface SearchDoc {
	id: string
	title: string
	content: string
	bigrams: string
	tags: string[]
	url: string
	type: string
	lang: string
}

const RE_CJK = /[\u4e00-\u9fff\u3400-\u4dbf]/g

function cjkBigrams(text: string): string {
	const cjk = text.match(RE_CJK)
	if (!cjk || cjk.length < 2) return ''
	const set = new Set<string>()
	for (let i = 0; i < cjk.length - 1; i++) {
		set.add(cjk[i] + cjk[i + 1])
	}
	return Array.from(set).join(' ')
}

function buildBigrams(...parts: string[]): string {
	return cjkBigrams(parts.join(' '))
}

export async function GET() {
	const defaultLang = i18n.defaultLocale
	const docs: SearchDoc[] = []
	const pathPrefix = (lang: string) => (lang === defaultLang ? '' : `/${lang}`)

	const posts = await getCollection('blog')
	for (const post of posts) {
		const parts = post.id.split('/')
		const fileName = parts.pop()!
		const lang = fileName.replace('.md', '')
		const slugId = post.data.slugId
		const title = post.data.title
		const content = post.data.description || ''
		const tags = [post.data.category || ''].filter(Boolean)

		docs.push({
			id: `post-${slugId}-${lang}`,
			title,
			content,
			bigrams: buildBigrams(title, content, tags.join(' ')),
			tags,
			url: `${pathPrefix(lang)}/blog/${slugId}/`,
			type: 'post',
			lang,
		})
	}

	const { authors, works } = loadGalleryData()
	for (const author of authors) {
		for (const lang of ['zh-cn', 'en'] as const) {
			const title = author.name[lang]
			const content = author.description[lang]
			docs.push({
				id: `gallery-author-${author.slug}-${lang}`,
				title,
				content,
				bigrams: buildBigrams(title, content),
				tags: [],
				url: `${pathPrefix(lang)}/gallery/${author.slug}/`,
				type: 'gallery-author',
				lang,
			})
		}
	}
	for (const work of works) {
		for (const lang of ['zh-cn', 'en'] as const) {
			const title = work.title[lang]
			const content = `${work.title[lang]} ${work.year}`
			const tags = work.tags || []
			docs.push({
				id: `gallery-work-${work.id}-${lang}`,
				title,
				content,
				bigrams: buildBigrams(title, content, tags.join(' ')),
				tags,
				url: `${pathPrefix(lang)}/gallery/${work.author}/`,
				type: 'gallery-work',
				lang,
			})
		}
	}

	for (const friend of friendLinkConfig) {
		for (const lang of ['zh-cn', 'en'] as const) {
			const title = friend.name
			const content = friend.description || ''
			docs.push({
				id: `friend-${friend.name}-${lang}`,
				title,
				content,
				bigrams: buildBigrams(title, content),
				tags: [],
				url: `${pathPrefix(lang)}/friends/`,
				type: 'friend',
				lang,
			})
		}
	}

	for (const link of externalLinkConfig) {
		if (link.enabled === false) continue
		for (const lang of ['zh-cn', 'en'] as const) {
			const title = link.title[lang]
			const content = link.description[lang]
			const tags = [link.tag].filter(Boolean)
			docs.push({
				id: `external-${link.title['zh-cn']}-${lang}`,
				title,
				content,
				bigrams: buildBigrams(title, content, tags.join(' ')),
				tags,
				url: `${pathPrefix(lang)}/friends/`,
				type: 'external-link',
				lang,
			})
		}
	}

	return new Response(JSON.stringify(docs), {
		headers: { 'Content-Type': 'application/json' },
	})
}
