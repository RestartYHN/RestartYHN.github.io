import fs from "node:fs"
import path from "node:path"
import galleryMeta from "../data/gallery.template.json"

type LocaleCode = "zh-cn" | "en"

export interface GalleryAuthor {
  slug: string
  name: Record<LocaleCode, string>
  avatar: string
  order: number
  enabled: boolean
  workCount: number
}

export interface GalleryWork {
  id: string
  author: string
  title: Record<LocaleCode, string>
  image: string
  thumb: string
  year: number
  tags: string[]
  enabled: boolean
  order: number
  link: string
}

interface GalleryMetaAuthor {
  slug: string
  name?: Partial<Record<LocaleCode, string>>
  avatar?: string
  order?: number
  enabled?: boolean
}

interface GalleryMetaWork {
  id?: string
  author?: string
  title?: Partial<Record<LocaleCode, string>>
  image?: string
  thumb?: string
  year?: number
  tags?: string[]
  enabled?: boolean
  order?: number
  link?: string
}

interface GalleryMetaFile {
  authors?: GalleryMetaAuthor[]
  works?: GalleryMetaWork[]
}

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"])

function getGalleryRoot(): string {
  return path.join(process.cwd(), "public", "gallery")
}

function asLocaleName(name: Partial<Record<LocaleCode, string>> | undefined, fallback: string): Record<LocaleCode, string> {
  return {
    "zh-cn": name?.["zh-cn"] || fallback,
    en: name?.en || fallback,
  }
}

function toPublicPath(author: string, file: string): string {
  return `/gallery/${author}/${file}`
}

function normalizeKey(v: string | undefined): string {
  return (v || "").toLowerCase()
}

export function loadGalleryData(): { authors: GalleryAuthor[]; works: GalleryWork[] } {
  const root = getGalleryRoot()
  if (!fs.existsSync(root)) {
    return { authors: [], works: [] }
  }

  const meta = galleryMeta as GalleryMetaFile
  const metaAuthors = meta.authors || []
  const metaWorks = meta.works || []

  const authorDirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !name.startsWith("."))

  const works: GalleryWork[] = []

  for (const authorDir of authorDirs) {
    const dirPath = path.join(root, authorDir)
    const files = fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    files.forEach((fileName, index) => {
      const imagePath = toPublicPath(authorDir, fileName)
      const fileBase = fileName.replace(path.extname(fileName), "")

      const matchedMeta =
        metaWorks.find((w) => normalizeKey(w.image) === normalizeKey(imagePath)) ||
        metaWorks.find((w) => normalizeKey(w.author) === normalizeKey(authorDir) && (w.order ?? -1) === index + 1)

      works.push({
        id: matchedMeta?.id || `${normalizeKey(authorDir)}-${String(index + 1).padStart(3, "0")}`,
        author: matchedMeta?.author || authorDir,
        title: asLocaleName(matchedMeta?.title, fileBase),
        image: matchedMeta?.image || imagePath,
        thumb: matchedMeta?.thumb || matchedMeta?.image || imagePath,
        year: matchedMeta?.year || new Date().getFullYear(),
        tags: matchedMeta?.tags || [],
        enabled: matchedMeta?.enabled !== false,
        order: matchedMeta?.order || index + 1,
        link: matchedMeta?.link || imagePath,
      })
    })
  }

  const authors: GalleryAuthor[] = authorDirs.map((slug, index) => {
    const metaAuthor = metaAuthors.find((a) => normalizeKey(a.slug) === normalizeKey(slug))
    const authorWorks = works.filter((w) => normalizeKey(w.author) === normalizeKey(slug))
    const fallbackAvatar = authorWorks[0]?.thumb || ""

    return {
      slug,
      name: asLocaleName(metaAuthor?.name, slug),
      avatar: metaAuthor?.avatar || fallbackAvatar,
      order: metaAuthor?.order || index + 1,
      enabled: metaAuthor?.enabled !== false,
      workCount: authorWorks.filter((w) => w.enabled !== false).length,
    }
  })

  return {
    authors: authors
      .filter((a) => a.enabled !== false)
      .sort((a, b) => a.order - b.order),
    works: works
      .filter((w) => w.enabled !== false)
      .sort((a, b) => a.order - b.order),
  }
}

export function getAuthorWorks(authorSlug: string): GalleryWork[] {
  const { works } = loadGalleryData()
  return works.filter((w) => normalizeKey(w.author) === normalizeKey(authorSlug))
}
