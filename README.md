基于 [Momo](https://github.com/Motues/Momo) 进行了大量功能拓展。

> 原项目特性：极简设计、深色模式、i18n、移动端适配、KaTex/Typst、RSS 等，详见[原项目 README](https://github.com/Motues/Momo)

## 新增功能

### 页面
- **音乐播放器** — 网易云账号登录，同步歌单/播客/专辑，全局悬浮播放器跨页面续播，实时歌词
- **碎碎念 (Memos)** — 短内容时间线，支持表情反应
- **鉴赏 (Appreciation)** — 画廊 + 文章，支持作者/标签分类
- **留言板** — 独立留言页面
- **外部链接 & Find Me** — 个人社交账号卡片

### 评论系统
- **点赞 + 表情反应** — 10 种 emoji 反应，指纹去重
- **Q&A 问答** — 独立问答模块（关于页）
- **表情选择器** — 黄脸 / 小电视 / 颜文字 / Emoji 四栏
- **图片上传** — 评论/回复支持粘贴和选择图片上传
- **置顶评论** — 多条置顶，按置顶时间排序
- **图片预览** — 点击放大、缩放、拖拽、轮播

### 交互
- **自定义光标轨迹** — Canvas 粒子/波纹特效（可开关）
- **背景切换器** — 多张背景图切换，支持浅色/深色模式独立设置
- **模糊搜索** — 基于 Fuse.js + 拼音，支持中英文混合检索

### 内容
- **文章置顶 + 多分类**
- **专辑卡片** — 网易云专辑/歌单嵌入 Markdown
- **音乐统计卡片**

## 环境要求

- **Node.js** >= 22
- **pnpm** >= 9

## 部署

```bash
pnpm install          # 安装依赖
pnpm dev              # 本地开发 → http://localhost:4321
pnpm build            # 生产构建到 ./dist
```

### GitHub Pages

本项目通过 GitHub Actions 自动部署到 GitHub Pages。配置文件 `CNAME` 用于自定义域名。主要环境变量：

| 变量 | 说明 |
|------|------|
| `PUBLIC_COMMENTS_API` | 评论后端地址 |
| `PUBLIC_MUSIC_API` | 音乐 API 代理地址 |
| `PUBLIC_NETEASE_API` | 网易云 API 地址 |

### 评论后端

配套评论系统：[Momo-Backend](https://github.com/RestartYHN/Momo-Backend)

## 指令

| 指令 | 作用 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览构建结果 |

## 配置

参考原项目[配置指南](https://github.com/Motues/Momo/blob/main/doc/config_zh-cn.md)和[更新指南](./doc/release_zh-cn.md)。

> 原项目：[Motues/Momo](https://github.com/Motues/Momo)
