export interface SearchResult {
	url: string
	meta: {
		title: string
	}
	excerpt: string
}

export interface SearchDoc {
	id: string
	title: string
	content: string
	tags: string[]
	url: string
	type: string
	lang: string
}
