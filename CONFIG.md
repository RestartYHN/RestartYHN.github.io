## 网站配置指南

### 添加博客文章
在 `src/content/blog/` 下新建目录，放 `zh-cn.md`：
```yaml
---
title: 文章标题
pubDate: 2026-05-14
slugId: my-post
description: 简介
image: "./images/cover.jpg"
category: 随笔
categories: [类型:随笔]
pinned: 1     # 置顶优先级，不填=不置顶
---
正文内容...
```
目录名 = slugId，图片放同级 `images/` 下。

### 添加鉴赏文章
同博客，目录建在 `src/content/appreciation/`，支持更多标签维度：
```yaml
categories: [作者:村上春树, 国家:日本, 文学体裁:小说, 类型:赏析]
```

### 添加画廊图片
1. 图片放入 `public/gallery/画师名/`
2. 编辑 `src/data/gallery.template.json` 登记信息：
```json
"tags": ["IP:初音未来", "画师:混合可可"]
```
3. 新画师需在 `authors` 数组注册

### 添加碎碎念
`src/content/memos/` 下新建 `YYYY-MM-DD.md`，无 frontmatter，直接写内容。

### 自定义背景图
图片放入 `public/cg/`，编辑 `src/components/misc/BackgroundSwitcher.astro` 的 `images` 数组添加路径。

### 添加友链
编辑 `src/config.ts` 的 `friendLinkConfig` 数组：
```ts
{ name: 'xxx', avatar: 'url', url: 'https://...', description: '...' }
```

### 音乐播放器
使用网易云音乐在线 API。编辑 `src/data/music.ts`：
- `neteaseUserId` — 网易云用户 ID（公开歌单模式）
- `defaultPlaylistId` — 默认加载的歌单 ID
- `preferPublicProfile` — `true` = 读取公开歌单，无需登录
- `seedTracks` — 默认占位歌曲列表

歌单 ID 从网易云分享链接获取：`music.163.com/playlist?id=xxxxx` 中的数字。

### 播客
编辑 `src/pages/[...locale]/music.astro` 第 2462 行 `rids` 数组：
```js
const rids = ['1490741063', '新播客ID'];
```
播客 ID 从网易云播客分享链接获取：`music.163.com/radio?id=xxxxx` 中的数字。

### 编辑页面文字
- 全局文案：`src/i18n/language/zh-cn.ts` / `en.ts`
- 关于页面：`src/content/spec/about/zh-cn.md` / `en.md`
- 友链页面说明：`src/content/spec/friends/zh-cn.md` / `en.md`
- 画廊画师简介：`src/data/gallery.template.json` 的 `description` 字段
