// 每张背景图片的元数据（手动编辑以控制每张图的呈现）
// 键为 public 下图片的路径（以 https://img.restartyhn.top/cg/... 开头）
// 可用字段：position (背景位置), size (background-size), overlay (rgba 或 transparent)
// 如果某项留空，页面将使用 CSS 中的默认回退值。

const bgMeta: Record<
  string,
  { position?: string; size?: string; overlay?: string; overlayLight?: string; overlayDark?: string }
> = {
  'https://img.restartyhn.top/cg/1st.jpg': { position: 'center 85%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/2nd.jpg': { position: 'center 50%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/3rd.jpg': { position: 'center 40%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/4th.jpg': { position: 'center 15%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/5th.jpg': { position: 'center 25%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/6th.jpg': { position: 'center 85%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/7th.jpg': { position: 'center 50%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/8th.jpg': { position: 'center 25%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/9th.jpg': { position: 'center 80%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/10th.jpg': { position: 'center 15%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  // xmm.jpg 在浅色主题上原先使用较强的白色罩层（0.7）导致界面元素不可见，降低为 0.15
  'https://img.restartyhn.top/cg/xmm.jpg': { position: 'center', size: 'cover', overlayLight: 'rgba(255,255,255,0.15)', overlayDark: 'rgba(10,10,10,0.35)' },
  'https://img.restartyhn.top/cg/dark-cg.jpg': { position: 'center 20%', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
  'https://img.restartyhn.top/cg/white.png': { position: 'center', size: 'cover', overlay: 'transparent' },
  'https://img.restartyhn.top/cg/stars.jpg': { position: 'center', size: 'cover', overlayLight: 'transparent', overlayDark: 'rgba(10,10,10,0.2)' },
};

export default bgMeta;
// (配置结束)
