import { getCollection } from 'astro:content'
import { loadGalleryData } from '@utils/gallery-utils'
import { friendLinkConfig, externalLinkConfig } from '@/config'
import { i18n } from 'astro:config/client'

interface SearchDoc {
	id: string
	title: string
	content: string
	tags: string[]
	url: string
	type: string
	lang: string
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

		docs.push({
			id: `post-${slugId}-${lang}`,
			title: post.data.title,
			content: post.data.description || '',
			tags: [post.data.category || ''].filter(Boolean),
			url: `${pathPrefix(lang)}/blog/${slugId}/`,
			type: 'post',
			lang,
		})
	}

	const { authors, works } = loadGalleryData()
	for (const author of authors) {
		for (const lang of ['zh-cn', 'en'] as const) {
			docs.push({
				id: `gallery-author-${author.slug}-${lang}`,
				title: author.name[lang],
				content: author.description[lang],
				tags: [],
				url: `${pathPrefix(lang)}/gallery/${author.slug}/`,
				type: 'gallery-author',
				lang,
			})
		}
	}
	for (const work of works) {
		for (const lang of ['zh-cn', 'en'] as const) {
			docs.push({
				id: `gallery-work-${work.id}-${lang}`,
				title: work.title[lang],
				content: `${work.title[lang]} ${work.year}`,
				tags: work.tags || [],
				url: `${pathPrefix(lang)}/gallery/${work.author}/`,
				type: 'gallery-work',
				lang,
			})
		}
	}

	for (const friend of friendLinkConfig) {
		for (const lang of ['zh-cn', 'en'] as const) {
			docs.push({
				id: `friend-${friend.name}-${lang}`,
				title: friend.name,
				content: friend.description || '',
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
			docs.push({
				id: `external-${link.title['zh-cn']}-${lang}`,
				title: link.title[lang],
				content: link.description[lang],
				tags: [link.tag].filter(Boolean),
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
