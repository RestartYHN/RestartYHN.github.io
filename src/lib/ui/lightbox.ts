export type LightboxVariant = "comment" | "gallery";

export interface LightboxHandle {
  close(): void;
}

export interface LightboxOptions {
  /** Image URLs to navigate, evaluated once when the lightbox opens. */
  getImages: () => string[];
  startIndex?: number;
  /** Where to attach the overlay. Defaults to <html>. */
  mount?: HTMLElement;
  variant?: LightboxVariant;
  autoplay?: boolean;
  autoplayMs?: number;
  zoomControls?: boolean;
  touchDrag?: boolean;
  /** Prevent page scrolling behind the overlay (mobile). */
  lockScroll?: boolean;
  labels?: { play?: string; pause?: string };
  /** Called when the user dismisses via backdrop / close button / Escape. */
  onClose?: () => void;
}

interface VariantConfig {
  overlayClass: string;
  overlayStyle?: string;
  closeBtn: string;
  closeIcon: string;
  prevBtn: string;
  nextBtn: string;
  navIcon: string;
}

const VARIANTS: Record<LightboxVariant, VariantConfig> = {
  comment: {
    overlayClass: "fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center overflow-hidden",
    closeBtn:
      "absolute top-4 right-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer",
    closeIcon: "w-6 h-6",
    prevBtn:
      "absolute left-2 sm:left-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer shadow-md",
    nextBtn:
      "absolute right-2 sm:right-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer shadow-md",
    navIcon: "w-8 h-8",
  },
  gallery: {
    overlayClass: "relative",
    overlayStyle:
      "position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;overflow:hidden",
    closeBtn:
      "absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer",
    closeIcon: "w-6 h-6",
    prevBtn:
      "absolute left-2 sm:left-8 z-10 w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors cursor-pointer md:flex shadow-md",
    nextBtn:
      "absolute right-2 sm:right-8 z-10 w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors cursor-pointer md:flex shadow-md",
    navIcon: "w-8 h-8 sm:w-10 sm:h-10",
  },
};

const ICONS = {
  close: (cls: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  prev: (cls: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>`,
  next: (cls: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>`,
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 22;

/**
 * Imperative image lightbox used by the comment area and the appreciation
 * gallery. Owns its own DOM; call `close()` to tear it down. User-initiated
 * dismissal (backdrop, close button, Escape) calls `onClose`.
 */
export function createLightbox(options: LightboxOptions): LightboxHandle {
  const {
    getImages,
    variant = "gallery",
    autoplay = false,
    autoplayMs = 3000,
    zoomControls = false,
    touchDrag = false,
    lockScroll = false,
    labels = {},
    onClose,
  } = options;

  const cfg = VARIANTS[variant];
  const images = getImages();
  let currentIndex = options.startIndex ?? 0;
  if (currentIndex < 0 || currentIndex >= images.length) currentIndex = 0;

  const mount = options.mount ?? document.body.parentElement ?? document.documentElement;
  if (lockScroll) document.documentElement.style.touchAction = "none";

  const playLabel = labels.play ?? "Play";
  const pauseLabel = labels.pause ?? "Pause";

  let scale = 1;
  let posX = 0;
  let posY = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  let autoplayTimer: ReturnType<typeof setInterval> | null = null;
  let isAutoplayRunning = false;
  let autoplayStartTime = 0;
  let animFrame: number | null = null;
  let stopAutoplay: () => void = () => {};

  const overlay = document.createElement("div");
  overlay.className = cfg.overlayClass;
  if (cfg.overlayStyle) overlay.style.cssText = cfg.overlayStyle;
  overlay.onclick = (e) => {
    if (e.target === overlay) onClose?.();
  };

  const closeBtn = document.createElement("button");
  closeBtn.className = cfg.closeBtn;
  closeBtn.innerHTML = ICONS.close(cfg.closeIcon);
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    onClose?.();
  };
  overlay.appendChild(closeBtn);

  const img = document.createElement("img");
  img.className = "max-w-full max-h-full object-contain rounded shadow-2xl select-none";
  img.src = images[currentIndex] ?? "";
  img.style.transition = "transform 0.1s ease-out";
  img.style.cursor = "grab";
  img.draggable = false;

  const updateTransform = (): void => {
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  };
  const resetTransform = (): void => {
    scale = 1;
    posX = 0;
    posY = 0;
    updateTransform();
  };
  const updateImage = (index: number): void => {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentIndex = index;
    img.src = images[currentIndex];
    resetTransform();
  };

  if (zoomControls) {
    const zoomInBtn = document.createElement("button");
    zoomInBtn.className =
      "absolute top-4 right-16 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-lg";
    zoomInBtn.textContent = "+";
    zoomInBtn.onclick = (e) => {
      e.stopPropagation();
      scale = Math.min(5, scale + 0.5);
      updateTransform();
    };
    overlay.appendChild(zoomInBtn);

    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.className =
      "absolute top-4 right-[7.5rem] z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-lg";
    zoomOutBtn.textContent = "−";
    zoomOutBtn.onclick = (e) => {
      e.stopPropagation();
      scale = Math.max(0.5, scale - 0.5);
      updateTransform();
    };
    overlay.appendChild(zoomOutBtn);
  }

  const prevBtn = document.createElement("button");
  prevBtn.className = cfg.prevBtn;
  prevBtn.innerHTML = ICONS.prev(cfg.navIcon);

  const nextBtn = document.createElement("button");
  nextBtn.className = cfg.nextBtn;
  nextBtn.innerHTML = ICONS.next(cfg.navIcon);

  prevBtn.onclick = (e) => {
    e.stopPropagation();
    stopAutoplay();
    updateImage(currentIndex - 1);
  };
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    stopAutoplay();
    updateImage(currentIndex + 1);
  };

  if (images.length > 1) {
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
  }

  if (autoplay) {
    const progressSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    progressSvg.setAttribute("class", "absolute inset-0 w-full h-full -rotate-90 overflow-visible");
    progressSvg.setAttribute("viewBox", "0 0 48 48");
    const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progressCircle.setAttribute("cx", "24");
    progressCircle.setAttribute("cy", "24");
    progressCircle.setAttribute("r", "22");
    progressCircle.setAttribute("fill", "none");
    progressCircle.setAttribute("stroke", "currentColor");
    progressCircle.setAttribute("stroke-width", "2");
    progressCircle.setAttribute("stroke-dasharray", `0 ${RING_CIRCUMFERENCE}`);
    progressCircle.setAttribute("stroke-linecap", "round");
    progressCircle.style.opacity = "0";
    progressCircle.style.transition = "none";
    progressSvg.appendChild(progressCircle);

    const playBtn = document.createElement("button");
    playBtn.style.cssText =
      "position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:none;cursor:pointer;background:rgba(255,255,255,0.12);color:#fff;transition:background 0.2s;backdrop-filter:blur(4px)";
    playBtn.onmouseenter = () => {
      playBtn.style.background = "rgba(255,255,255,0.25)";
    };
    playBtn.onmouseleave = () => {
      playBtn.style.background = "rgba(255,255,255,0.12)";
    };

    const setPlayIcon = (svg: string, title: string): void => {
      playBtn.innerHTML = "";
      playBtn.appendChild(progressSvg);
      const icon = document.createElement("span");
      icon.innerHTML = svg;
      icon.className = "relative z-10 flex items-center justify-center";
      playBtn.appendChild(icon);
      playBtn.title = title;
    };

    const updateProgressRing = (): void => {
      if (!isAutoplayRunning) {
        progressCircle.style.opacity = "0";
        progressCircle.setAttribute("stroke-dasharray", `0 ${RING_CIRCUMFERENCE}`);
        if (animFrame !== null) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
        return;
      }
      const elapsed = Date.now() - autoplayStartTime;
      const pct = Math.min(1, elapsed / autoplayMs);
      const filled = RING_CIRCUMFERENCE * pct;
      progressCircle.style.opacity = "1";
      progressCircle.setAttribute("stroke-dasharray", `${filled} ${RING_CIRCUMFERENCE - filled}`);
      if (pct < 1) animFrame = requestAnimationFrame(updateProgressRing);
    };

    const startAutoplay = (): void => {
      if (images.length <= 1) return;
      stopAutoplay();
      isAutoplayRunning = true;
      setPlayIcon(ICONS.pause, pauseLabel);
      autoplayStartTime = Date.now();
      updateProgressRing();
      autoplayTimer = setInterval(() => {
        autoplayStartTime = Date.now();
        updateProgressRing();
        updateImage(currentIndex + 1);
      }, autoplayMs);
    };

    stopAutoplay = (): void => {
      if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
      isAutoplayRunning = false;
      if (animFrame !== null) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
      progressCircle.style.opacity = "0";
      progressCircle.setAttribute("stroke-dasharray", `0 ${RING_CIRCUMFERENCE}`);
      setPlayIcon(ICONS.play, playLabel);
    };

    setPlayIcon(ICONS.play, playLabel);
    playBtn.onclick = (e) => {
      e.stopPropagation();
      if (isAutoplayRunning) stopAutoplay();
      else startAutoplay();
    };

    const wrapper = document.createElement("div");
    wrapper.className = "absolute bottom-6 left-1/2 -translate-x-1/2 z-10";
    wrapper.appendChild(playBtn);
    if (images.length > 1) overlay.appendChild(wrapper);
  }

  overlay.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.5, Math.min(5, scale + delta));
      updateTransform();
    },
    { passive: false },
  );

  img.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    img.style.cursor = "grabbing";
    img.style.transition = "none";
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    posX += e.clientX - lastX;
    posY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    updateTransform();
  });
  window.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      img.style.cursor = "grab";
      img.style.transition = "transform 0.1s ease-out";
    }
  });
  img.addEventListener("dblclick", () => {
    resetTransform();
  });

  if (touchDrag) {
    let touchDragging = false;
    let touchLastX = 0;
    let touchLastY = 0;
    img.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          touchLastX = e.touches[0].clientX;
          touchLastY = e.touches[0].clientY;
          touchDragging = true;
        }
      },
      { passive: true },
    );
    img.addEventListener(
      "touchmove",
      (e) => {
        if (!touchDragging || e.touches.length !== 1) return;
        e.preventDefault();
        posX += e.touches[0].clientX - touchLastX;
        posY += e.touches[0].clientY - touchLastY;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
        updateTransform();
      },
      { passive: false },
    );
    img.addEventListener("touchend", () => {
      touchDragging = false;
    });
  }

  overlay.appendChild(img);
  mount.appendChild(overlay);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      onClose?.();
      return;
    }
    if (images.length > 1) {
      if (e.key === "ArrowLeft") {
        stopAutoplay();
        updateImage(currentIndex - 1);
      }
      if (e.key === "ArrowRight") {
        stopAutoplay();
        updateImage(currentIndex + 1);
      }
    }
  };
  document.addEventListener("keydown", onKey);

  const close = (): void => {
    document.removeEventListener("keydown", onKey);
    stopAutoplay();
    if (lockScroll) document.documentElement.style.touchAction = "";
    overlay.remove();
  };

  return { close };
}
