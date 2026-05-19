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
1. 通过 PicList 上传图片到 R2 桶 `img.restartyhn.top/画师名/`
2. 编辑 `src/data/gallery.template.json` 登记信息（`image`、`thumb`、`avatar` 用 R2 完整 URL）：
```json
"tags": ["IP:初音未来", "画师:混合可可"]
```
3. 新画师需在 `authors` 数组注册
4. `src/utils/gallery-utils.ts` 的 `R2_BASE` 指向你的 R2 自定义域

### 添加碎碎念
`src/content/memos/` 下新建 `YYYY-MM-DD.md`，无 frontmatter，直接写内容。

### 自定义背景图
1. 通过 PicList 上传图片到 R2 桶 `img.restartyhn.top/cg/`
2. 编辑 `src/components/misc/BackgroundSwitcher.astro` 的 `images` 数组，用 R2 完整 URL
3. 编辑 `src/data/bg-meta.ts`，key 同步改为 R2 URL

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

### 基础 Markdown 语法
支持所有的基础标准 Markdown 功能，包括但不限于：
- **标题**：1-6级标题 (`# 标题`)。
- **列表**：无序列表 (`-`) 和有序列表 (`1.`)。
- **文字样式**：加粗 (`**加粗**`)、斜体 (`*斜体*`)、删除线 (`~~内容~~`)。
- **其他**：表格元素、代码区块（行内和多行包裹区块）、图片及地址链接的插入等常规功能均正常支持。

### Markdown 及组件扩展语法
写文章及评论时支持以下特有扩展语法及组件：

#### 文本样式扩展
- **防剧透/模糊**：`!!防剧透!!`
- **彩虹渐变文字**：`==彩虹渐变==`
- **下划线**：`++下划线++`
- **注音 (Ruby)**：`{注音}(pinyin)` 或 `{一|个|字}(yi|ge|zi)`

*(注：如果需要嵌套组合使用，它们互相可以嵌套，但**标准 Markdown (`**` / `*`) 必须放在最外层**，例如 `**==加粗彩虹==**`。)*

#### 特殊容器 (Alert/Quote)
使用 `:::` 语法可以插入特殊的提示框和引用框：
- **提示框 (Alert)**：支持 `:::note`, `:::tip`, `:::important`, `:::warning`, `:::caution`。也可以自定义标题，例如 `:::important[自定义标题]`。
- **引用 (Quote)**：`:::quote ... :::`，内可包含普通文本或公式。

#### 特殊卡片
用 `::` 语法可插入集成卡片：
- **音乐卡片**：`::music{id="30431366"}` （填入网易云音乐单曲ID）
- **GitHub 卡片**：`::github{repo="Motues/Momo"}` （填入仓库名）
- **视频卡片（外部视频导入）**：可以直接使用原生的 HTML `<iframe>` 标签插入各大平台的外部视频（如 Bilibili）。建议补充 `width="100%"` 参数使其自适应：
  ```html
  <iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1n281ePEd9" scrolling="no" frameborder="no" allowfullscreen="true" width="100%" height="468"></iframe>
  ```

#### 高级排版引擎
- **KaTeX 数学公式**：支持 `$行内公式$` 和 `$$块级公式$$`。
- **Typst 支持**：使用 ````typst` 代码块可引入 Typst 排版代码进行复杂的图形或文本排版。

### 编辑页面文字
- 全局文案：`src/i18n/language/zh-cn.ts` / `en.ts`
- 关于页面：`src/content/spec/about/zh-cn.md` / `en.md`
- 友链页面说明：`src/content/spec/friends/zh-cn.md` / `en.md`
- 画廊画师简介：`src/data/gallery.template.json` 的 `description` 字段
