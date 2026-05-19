---
title: "Momo 博客功能测试与展示"
pubDate: 2026-05-18
slugId: sample-features
description: "这是一篇自动生成的示例文章，用于集中展示博客的各项 Markdown 扩展语法、特殊组件（音乐卡片、视频、GitHub 卡片）以及高级排版功能。"
category: 测试
categories: [类型:测试]
---

## 1. 特殊卡片展示

### 音乐卡片 (Vercel API)
这是刚才配置好的网易云音乐卡片，会自动调用您的 `api-enhanced` 接口加载：

::music{id="1825057515"}

### GitHub 卡片
可以很方便地展示 GitHub 仓库状态：

::github{repo="RestartYHN/RestartYHN.github.io"}

### 外部视频导入
通过 iframe 直接嵌入 Bilibili 视频，自适应宽度：

<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1n281ePEd9" scrolling="no" frameborder="no" allowfullscreen="true" width="100%" height="468"></iframe>

---

## 2. 文本样式扩展

这些是 Momo 特有的文字排版效果：

- **防剧透/模糊**：这里有一个 !!被隐藏的真相!!，鼠标移上去或者点击才能看清。
- **彩虹渐变**：感受一下 ==五彩斑斓的色彩== 吧。
- **下划线**：可以通过 ++强调标记++ 来突出重点。
- **拼音注音**：支持优雅的注音排版，比如 {初音未来}(Hatsune|Miku) 或是 {拼}(pīn){音}(yīn)。
- **嵌套组合**：请务必记住标准 Markdown 符号在外层，例如：**==加粗的彩虹剧透==**。

---

## 3. 特殊容器与提示框

### 各种级别的 Alert 提示框

:::note
这是一个普通的 `note` 提示信息。
:::

:::tip
这是一个有用的 `tip` 建议。
:::

:::important[自定义的重点标题]
这是一个带有自定义标题的 `important` 提示框。
:::

:::caution
注意！这是 `caution` 警告信息。
:::

### 引用区块 (Quote)

:::quote
"生活就像海洋，只有意志坚强的人，才能到达彼岸。"
<br><right>—— 马克思</right>
:::

---

## 4. 高级排版引擎

### KaTeX 格式数学公式

爱因斯坦的质能方程是完美的优雅体现：$E = mc^2$。

复杂的块级数学公式：
$$
f(x) = \int_{-\infty}^\infty \hat f(\xi)\,e^{2 \pi i \xi x} \,d\xi
$$

### Typst 渲染

如果你有更复杂的排版需求，比如绘制图形或函数，可以使用内嵌的 Typst：

```typst
#set page(width: auto, height: auto, margin: 10pt)
#set text(fill: rgb("#2f61eb"), size: 20pt)

$ cal(A) = pi r^2 $

Hello from *Typst*!
```
