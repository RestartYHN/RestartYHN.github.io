---
title: 网站配置指南与功能展示
pubDate: 2026-05-19
description: 收录常用功能配置方式与 Markdown 扩展演示
slugId: guide
category: 指南
categories: [类型:指南]
pinned: 1
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
- `pinned` 置顶优先级，数字越大越靠前，不填=不置顶，首页卡片前显示📌图钉图标
- `draft` 草稿开关，设为 `true` 时文章仅本地/开发环境可见，生产构建不显示
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
- 标签格式：`"IP:初音未来"`（`维度:值`）；画师由 `author` 字段关联，**无需** `画师:` 标签
- 新增画师需 R2 上传图片 + JSON 注册两步，也可用脚本：
```bash
pnpm newauthor slug "中文名" "English Name" "头像R2链接" "中文简介" "English description"
```

也可用脚本一行登记，支持批量 `&&` 串联：
```bash
pnpm newgallery "url1" Matcha "鹿目圆" 2026 "IP:魔法少女小圆" && \
pnpm newgallery "url2" Rumoon "初音未来" 2026 "IP:初音未来"
```

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

### 首页旋转签名
使用脚本同时追加到中英文语言文件，支持批量：
```bash
pnpm newsignature "中文句子" "——中文出处" "English sentence" "-- English credit"
pnpm newsignature "把日常写成可回看的轨迹" "—— 来自 Restart 的日常记录" "Turn everyday into a traceable track" "-- From Restart's daily notes"
```

### 评论区表情
编辑 `src/components/comment/EmojiPicker.svelte` 第 14-61 行的 `bilibiliEmojis` 数组：
```js
{ name: 'doge', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_doge.png' }
```
- 表情图片托管在 unpkg CDN，可替换为自定义 URL
- 支持 Bilibili、颜文字、Emoji 三个 Tab 切换

### 编辑文字
- 全局文案：`i18n/language/zh-cn.ts` / `en.ts`
- 关于/友链：`content/spec/about/`、`content/spec/friends/`
- 画师简介：`gallery.template.json` 的 `description`

---

## 功能展示

### 音乐卡片
::music{id="1825057515"}

### 专辑卡片
::album{id="381824526"}

### GitHub 卡片
::github{repo="RestartYHN/RestartYHN.github.io"}

### 文章引用卡片
::blog{slug="3rd"}

::appreciation{slug="3rd"}

### 视频
<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1sxUHBREEt" scrolling="no" frameborder="no" allowfullscreen="true" width="100%" height="468"></iframe>

以上六种卡片的写法：
```markdown
::music{id="歌曲ID"}           ← ID 从 music.163.com/song?id=xxx 取数字
::album{id="专辑ID"}           ← ID 从 music.163.com/album?id=xxx 取数字
::github{repo="用户/仓库"}
::blog{slug="slugId"}         ← slugId 即文章目录名
::appreciation{slug="slugId"} ← slugId 即鉴赏文章目录名

<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=视频BV号"
  scrolling="no" frameborder="no" allowfullscreen="true"
  width="100%" height="468"></iframe>
```

---

## Markdown 语法

### 标题
1-6 个 `#` 表示标题层级，`#` 后需加空格：
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 段落与换行
段落之间空一行即可分段。若需在同一段落内换行但不分段，在行尾加**两个空格**再回车。

### 文字样式
| 写法 | 效果 | 说明 |
|---|---|---|
| `**加粗**` | **加粗** | 双星号或双下划线 |
| `*斜体*` | *斜体* | 单星号或单下划线 |
| `***粗斜体***` | ***粗斜体*** | 三星号叠加 |
| `~~删除线~~` | ~~删除线~~ | 双波浪线 |
| `` `代码` `` | `代码` | 反引号包裹，行内代码 |

### 块引用
`>` 开头表示引用，多个 `>` 可嵌套：
```markdown
> 念念不忘
>> 必有回响
```
显示效果：
> 念念不忘
>> 必有回响

### 代码块
三个反引号包裹，首行指定语言可启用语法高亮：
```cpp
#include <iostream>
int main() {
    std::cout << "Hello World!" << std::endl;
    return 0;
}
```

### 列表
有序列表用 `1.` 开头（数字不必连续，渲染时自动递增）；无序列表用 `-` 或 `*`；子项缩进四个空格或一个 Tab：
```markdown
1. 第一项
2. 第二项
   - 嵌套项
3. 第三项
```

### 链接与图片
```markdown
[文字](URL "鼠标悬停提示")
![图片替代文字](URL "图片标题")
```
图片标题显示在图片下方。

### 表格
`|` 分隔列，`---` 创建表头。冒号控制对齐：`:---` 左对齐，`:---:` 居中，`---:` 右对齐：
```markdown
| 水果 | 颜色 | 口感 |
|:-----|:----:|-----:|
| 西瓜 | 绿色 | 甜   |
| 葡萄 | 紫色 | 酸   |
```
| 水果 | 颜色 | 口感 |
|:-----|:----:|-----:|
| 西瓜 | 绿色 | 甜   |
| 葡萄 | 紫色 | 酸   |

### 任务清单
```markdown
- [x] 已完成
- [ ] 待办
```
- [x] 已完成
- [ ] 待办

### 水平线
三个或更多 `---` 或 `***` 单独成行。

---

## 扩展语法（Momo 特有）

### 文本特效
Momo 扩展的自定义文本效果（标准 Markdown 之外）：

| 写法 | 效果 | 说明 |
|---|---|---|
| `!!防剧透!!` | !!防剧透!! | 鼠标悬停或点击查看 |
| `==彩虹渐变==` | ==彩虹渐变== | 文字彩虹渐变色 |
| `++下划线++` | ++下划线++ | 文字下方添加横线 |
| `{注音}(pinyin)` | {注音}(pinyin) | 文字上方显示拼音注音 |
| `^文字{色号}^` | ^红色{#e74c3c}^ ^蓝色{#3b82f6}^ ^绿色{#27ae60}^ | 任意颜色高亮,色号支持 `#hex` 或颜色名 `^文字^` 不加色号则用默认色 |

### 组合规则
多个特效可叠加使用，但**标准 Markdown（`**` / `*`）必须放在最外层**，否则会被优先解析切碎导致失效：

| 会失效 | 正确写法 |
|---|---|
| `==**彩虹**==` | `**==加粗彩虹==**` |
| `!!**剧透**!!` | `**!!加粗剧透!!**` |

自定义语法之间可任意互套，例如 `!!==剧透彩虹==!!`。

### 提示框
`:::` 语法创建提示容器，支持 `note`、`tip`、`important`、`caution`、`warning` 五种类型。可自定义标题：

:::tip
这是一个 `tip` 建议示例。
:::

:::note
普通的 `note` 提示。
:::

:::caution
`caution` 警告信息。
:::

```markdown
:::tip[自定义标题]
内容
:::
```

### 引用
`:::quote` 创建带装饰引号的引用区块：

:::quote
"生活就像海洋，只有意志坚强的人，才能到达彼岸。"
<br><right>—— 马克思</right>
:::

```markdown
:::quote
引用文字
<right>—— 署名</right>
:::
```

### KaTeX 数学公式
行内 `$E=mc^2$` → $E=mc^2$，块级 `$$公式$$`：
```tex
$$
f(x) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x} \,d\xi
$$
```
$$
f(x) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x} \,d\xi
$$

### Typst 排版
使用 ````typst```` 代码块编写 Typst 排版代码，渲染为 SVG 图形：

源码：
````
```typst
#set page(width: auto, height: auto, margin: 10pt)
#set text(fill: rgb("#2f61eb"), size: 20pt)
$ cal(A) = pi r^2 $
Hello from *Typst*!
```
````

渲染效果：
```typst
#set page(width: auto, height: auto, margin: 10pt)
#set text(fill: rgb("#2f61eb"), size: 20pt)
$ cal(A) = pi r^2 $
Hello from *Typst*!
```
