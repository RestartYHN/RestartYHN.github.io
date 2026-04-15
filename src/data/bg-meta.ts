// 每张背景图片的元数据（手动编辑以控制每张图的呈现）
// 键为 public 下图片的路径（以 /cg/... 开头）
// 可用字段：position (背景位置), size (background-size), overlay (rgba 或 transparent)
// 如果某项留空，页面将使用 CSS 中的默认回退值。

const bgMeta: Record<
  string,
  { position?: string; size?: string; overlay?: string; overlayLight?: string; overlayDark?: string }
> = {
  '/cg/1st.jpg': { position: 'center 85%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/2nd.jpg': { position: 'center 50%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/3rd.jpg': { position: 'center 20%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/4th.jpg': { position: 'center 15%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/5th.jpg': { position: 'center 25%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/6th.jpg': { position: 'center 85%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/7th.jpg': { position: 'center 50%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/8th.jpg': { position: 'center 25%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/9th.jpg': { position: 'center 80%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/10th.jpg': { position: 'center 15%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  '/cg/xmm.jpg': { position: 'center', size: 'cover', overlayLight: 'rgba(251,251,251,0.7)', overlayDark: 'rgba(10,10,10,0.35)' },
  '/cg/dark-cg.jpg': { position: 'center 20%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
};

export default bgMeta;
// (配置结束)
