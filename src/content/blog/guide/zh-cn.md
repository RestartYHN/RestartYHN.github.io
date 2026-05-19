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
在 `src/content/blog/` 下新建目录，放 `zh-cn.md`。目录名 = slugId，图片放同级 `images/`：
```yaml
---
title: 文章标题
pubDate: 2026-05-14
slugId: my-post
description: 简介
image: "./images/cover.jpg"
categories: [类型:随笔]
pinned: 1          # 置顶优先级，数字越大越靠前，不填=不置顶
---
```
- `categories` 为多级标签数组，格式 `维度:值`（如 `类型:随笔`、`体裁:教程`）
- `category` 为旧版单字符串分类，向下兼容，归档中归入「其他」维度
- 启用英文需另建 `en.md`

### 鉴赏文章
目录建在 `src/content/appreciation/`，frontmatter 与博客文章格式一致。支持更多标签维度：
```yaml
categories: [作者:村上春树, 国家:日本, 文学体裁:小说, 类型:赏析]
```
- 标签维度自由定义，如 `IP`、`画师`、`作者`、`国家`、`文学体裁`、`流派`
- 归档页按维度分组展示，支持 AND/OR 筛选

### 画廊
使用 Cloudflare R2 图床 + PicList 上传。图片存入 `img.restartyhn.top/画师名/`，编辑 `src/data/gallery.template.json`：
- `authors` 数组注册画师（slug、name、description、avatar、order）
- `works` 数组登记作品（id、author、title、image、year、tags）
- 标签格式：`"IP:初音未来"`、`"画师:混合可可"`
- 新增画师需 R2 上传图片 + JSON 注册两步

### 碎碎念
`src/content/memos/` 下新建 `YYYY-MM-DD.md`，无 frontmatter，直接写 Markdown。
- 文件名即日期，按时间降序排列
- 支持时分：`YYYY-MM-DDTHHMM.md`（如 `2026-05-19T1227.md`）
- 内容过长时卡片自动折叠

### 背景图
PicList 上传到 R2 `img.restartyhn.top/cg/`，编辑两个文件：
- `src/components/misc/BackgroundSwitcher.astro` 的 `images` 数组加 R2 URL
- `src/data/bg-meta.ts` 的 key 同步改为 R2 URL，可配置 overlay/position/size
- 默认深色主题加载 `dark-cg.jpg`，浅色主题加载 `xmm.jpg`

### 开屏与过场动画
- 加载中 GIF：`public/images/` 下放 GIF 文件，`Layout.astro` 中修改 `<img>` 的 `src`
- 开场帷幕动画：`public/images/splash/` 下放背景图（桌面版 `desktop*.jpg`、移动版 `mobile*.jpg`），`Layout.astro` 同步图片名
- 过场动画：支持多组 GIF 随机切换

### 友链
`src/config.ts` 的 `friendLinkConfig` 数组：
```ts
{ name: 'xxx', avatar: 'url', url: 'https://...', description: '...' }
```

### 音乐播放器
编辑 `src/data/music.ts`，使用网易云音乐 API：
- `neteaseUserId` — 网易云用户 ID
- `defaultPlaylistId` — 默认加载的歌单 ID，从 `music.163.com/playlist?id=xxxxx` 取数字部分
- `preferPublicProfile` — `true` = 公开歌单免登录
- `preferDirectNeteaseApi` — `true` = 直连网易云 API
- `seedTracks` — 默认占位歌曲（id、title、artist、cover）
- 页面歌词滚动自动定位，音乐卡片点击联动全局播放器

### 播客
`src/pages/[...locale]/music.astro` 第 2462 行 `rids` 数组：
```js
const rids = ['1490741063', '新播客ID'];
```
ID 从 `music.163.com/radio?id=xxxxx` 获取。

### R2 图床
画廊图片和背景图通过 Cloudflare R2 + 自定义域名 `img.restartyhn.top` 加载。
- PicList（Amazon S3 协议）上传，按 `画师名/` 路径分文件夹
- `gallery-utils.ts` 的 `R2_BASE` 指向自定义域名
- 博客和碎碎念图片较少，仍走 Git 本地存储

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
| `!!防剧透!!` | !!防剧透!! |
| `==彩虹渐变==` | ==彩虹渐变== |
| `++下划线++` | ++下划线++ |
| `{注音}(pinyin)` | {注音}(pinyin) |
| `{一|个|字}(yi|ge|zi)` | {一|个|字}(yi|ge|zi) |

标准 Markdown 照常：**加粗**、*斜体*、~~删除线~~、`代码`。

### 组合规则

标准 Markdown（`**`/`*`）放最外层才生效：

| 写法 | 效果 | 原因 |
|---|---|---|
| `**==加粗彩虹==**` | **==加粗彩虹==** | 标准语法在外 |
| `**!!加粗剧透!!**` | **!!加粗剧透!!** | 同上 |
| `!!==剧透包彩虹==!!` | !!==剧透包彩虹==!! | 自定义语法互套可用 |
| `==!!++彩虹剧透线++!!==` | ==!!++彩虹剧透线++!!== | 三合一也行 |
| `**++==粗体线虹==++**` | **++==粗体线虹==++** | 标准语法最外层 |
| `==**彩虹**==` | ==**彩虹**== | `**` 在内侧被优先切碎，失效 |
| `!!**剧透**!!` | !!**剧透**!! | 同上 |
| `{*斜体*}(py)` | {*斜体*}(py) | `{}` 内 `*` 被优先解析 |

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

:::caution
注意！这是 `caution` 警告信息。
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
