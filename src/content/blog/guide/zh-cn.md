---
title: 网站配置指南与功能展示
pubDate: 2026-05-19
description: 收录常用功能配置方式与 Markdown 扩展演示
slugId: guide
category: 指南
categories: [类型:指南]
---

## 配置指南

### 博客文章
在 `src/content/blog/` 下新建目录，放 `zh-cn.md`：
```yaml
---
title: 文章标题
pubDate: 2026-05-14
slugId: my-post
description: 简介
image: "./images/cover.jpg"
categories: [类型:随笔]
---
```
目录名 = slugId，图片放同级 `images/` 下。

### 鉴赏文章
目录建在 `src/content/appreciation/`，支持多级标签：
```yaml
categories: [作者:村上春树, 国家:日本, 文学体裁:小说, 类型:赏析]
```

### 画廊
PicList 上传到 R2 桶 `img.restartyhn.top/画师名/`，编辑 `src/data/gallery.template.json`：
```json
"tags": ["IP:初音未来", "画师:混合可可"]
```

### 碎碎念
`src/content/memos/` 下新建 `YYYY-MM-DD.md`，无 frontmatter，直接写。

### 背景图
PicList 上传到 R2 `img.restartyhn.top/cg/`，编辑 `BackgroundSwitcher.astro` 的 `images` 数组和 `bg-meta.ts`。

### 过场动画
`public/images/` 下放 GIF 文件；`public/images/splash/` 下放开场背景图，`Layout.astro` 同步图片名。

### 友链
`src/config.ts` 的 `friendLinkConfig` 数组：
```ts
{ name: 'xxx', avatar: 'url', url: 'https://...', description: '...' }
```

### 音乐播放器
编辑 `src/data/music.ts`：`neteaseUserId`、`defaultPlaylistId`、`seedTracks`。歌单 ID 从 `music.163.com/playlist?id=xxxxx` 获取。

### 播客
`music.astro` 第 2462 行 `rids` 数组，ID 从 `music.163.com/radio?id=xxxxx` 获取。

### 编辑文字
- 全局文案：`i18n/language/zh-cn.ts` / `en.ts`
- 关于/友链：`content/spec/about/`、`content/spec/friends/`
- 画师简介：`gallery.template.json` 的 `description`

---

## 功能展示

### 音乐卡片
::music{id="1825057515"}

### GitHub 卡片
::github{repo="RestartYHN/RestartYHN.github.io"}

### 视频
<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1n281ePEd9" scrolling="no" frameborder="no" allowfullscreen="true" width="100%" height="468"></iframe>

---

## Markdown 扩展语法

### 文本样式

| 写法 | 效果 |
|---|---|
| `!!防剧透!!` | 鼠标悬停/点击看清 |
| `==彩虹渐变==` | ==彩虹渐变== |
| `++下划线++` | ++下划线++ |
| `{注音}(pinyin)` | {注音}(pinyin) |

### 组合规则

标准 Markdown（`**`/`*`）放最外层才生效：

| 写法 | 文章 | 原因 |
|---|---|---|
| `**==彩虹==**` | 正常 | 标准语法在外 |
| `==**彩虹**==` | 失效 | `**` 在内侧被优先切碎 |
| `!!**剧透**!!` | 失效 | 同上 |

### 提示框

:::note
这是一个普通 `note`。
:::

:::tip
这是一个 `tip` 建议。
:::

:::important[自定义标题]
带有自定义标题的 `important`。
:::

### 引用

:::quote
"生活就像海洋，只有意志坚强的人，才能到达彼岸。"
<br><right>—— 马克思</right>
:::

### KaTeX 数学公式

爱因斯坦质能方程：$E = mc^2$

$$
f(x) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x} \,d\xi
$$

### Typst 排版

```typst
#set page(width: auto, height: auto, margin: 10pt)
#set text(fill: rgb("#2f61eb"), size: 20pt)

$ cal(A) = pi r^2 $

Hello from *Typst*!
```
