import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { i18n } from "astro:config/client";

/**
 * 获取排序后的博客条目
 * @param filter 过滤函数，可选，默认过滤掉生产环境中的草稿文章
 * @param sort 排序函数，可选，默认按发布日期降序排列
 * @returns 排序后的博客条目数组
 */
// 1. 定义一个扩展类型，包含 fallback 状态
export type BlogEntryWithLocaleStatus = CollectionEntry<'blog'> & {
  isFallback?: boolean;
};

export async function getBlogEntrySort(
  lang?: string,
  filter?: (entry: CollectionEntry<'blog'>) => boolean | undefined,
  sort?: (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => number
): Promise<BlogEntryWithLocaleStatus[]> { // 修改返回类型
  
  const defaultFilter = ({ data }: CollectionEntry<'blog'>) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  };

  const defaultSort = (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => {
    // Sort by pinned priority first (higher pinned value comes first), then by pubDate desc, then by id desc
    const pa = Number(a.data?.pinned || 0);
    const pb = Number(b.data?.pinned || 0);
    if (pb !== pa) return pb - pa;
    const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  };

  const blogEntries = await getCollection('blog', filter || defaultFilter);

  const grouped = new Map<string, Record<string, CollectionEntry<'blog'>>>();
  const defaultLanguage = i18n!.defaultLocale;

  for (const post of blogEntries) {
    const parts = post.id.split('/');
    const fileName = parts[parts.length - 1];
    const id = parts.slice(0, -1).join('/');
    const language: string = fileName.replace('.md', '');

    if (!grouped.has(id)) {
      grouped.set(id, {});
    }
    grouped.get(id)![language] = post;
  }

  const selectedEntries: BlogEntryWithLocaleStatus[] = [];
  
  for (const [id, translations] of grouped.entries()) {
    let selectedPost: CollectionEntry<'blog'> | undefined;
    let isFallback = false; // 默认为 false
    
    if (lang && lang !== defaultLanguage) {
      if (translations[lang]) {
        selectedPost = translations[lang];
      } else if (translations[defaultLanguage]) {
        // --- 关键修改点：触发回退逻辑 ---
        selectedPost = translations[defaultLanguage];
        isFallback = true; 
      }
    } else {
      if (translations[defaultLanguage]) {
        selectedPost = translations[defaultLanguage];
      }
    }
    
    if (selectedPost) {
      selectedEntries.push({
        ...selectedPost,
        id: id,
        isFallback: isFallback // 将状态注入对象
      });
    }
  }

  return selectedEntries.sort(sort || defaultSort);
}

export async function getSpec(
    lang: string,
    spec: string
) {
    const defaultLanguage = i18n!.defaultLocale;
    let collection = await getEntry('spec', `${spec}/${lang}`)
    if(!collection) collection = await getEntry('spec', `${spec}/${defaultLanguage}`);
    return collection;
}

export type AppreciationEntryWithLocaleStatus = CollectionEntry<'appreciation'> & {
  isFallback?: boolean;
};

export async function getAppreciationEntrySort(lang: string) {
  const defaultLanguage = i18n!.defaultLocale;
  const entries = await getCollection('appreciation', ({ data }: CollectionEntry<'appreciation'>) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const grouped = new Map<string, Record<string, CollectionEntry<'appreciation'>>>();
  for (const entry of entries) {
    const parts = entry.id.split('/');
    const fileName = parts.pop()!;
    const slugId = parts.join('/');
    const language = fileName.replace('.md', '');
    if (!grouped.has(slugId)) grouped.set(slugId, {});
    grouped.get(slugId)![language] = entry;
  }

  const selected: AppreciationEntryWithLocaleStatus[] = [];
  for (const [id, translations] of grouped.entries()) {
    let selectedEntry: CollectionEntry<'appreciation'> | undefined;
    let isFallback = false;
    if (lang && lang !== defaultLanguage) {
      if (translations[lang]) selectedEntry = translations[lang];
      else if (translations[defaultLanguage]) { selectedEntry = translations[defaultLanguage]; isFallback = true; }
    } else {
      if (translations[defaultLanguage]) selectedEntry = translations[defaultLanguage];
    }
    if (selectedEntry) selected.push({ ...selectedEntry, id, isFallback });
  }

  return selected.sort((a, b) => {
    const pa = Number(a.data?.pinned || 0);
    const pb = Number(b.data?.pinned || 0);
    if (pb !== pa) return pb - pa;
    const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  });
}

export async function getMemos() {
  const collection = await getCollection('memos');
  return collection;
}