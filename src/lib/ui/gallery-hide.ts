export interface GalleryHideOptions {
  /** Selectors of the toggle buttons (e.g. ["#tag-hide-toggle", "#tag-hide-toggle-mobile"]). */
  buttonIds: string[];
  /** localStorage key holding the persisted hidden state. */
  storageKey?: string;
}

const COLLAPSE_CLASS = "gallery-hide-cards";

/**
 * Binds the "hide card text" toggles used on the appreciation pages.
 * The collapsed state itself is applied by an inline head script in Layout.astro
 * to avoid a flash; this only syncs labels/active styles and handles clicks.
 */
export function initGalleryHide(options: GalleryHideOptions): void {
  const { buttonIds, storageKey = "momo-gallery-hide-cards" } = options;
  const btns = document.querySelectorAll<HTMLElement>(buttonIds.join(","));
  if (!btns.length) return;

  const isEn = (): boolean => document.documentElement.lang === "en";

  const syncUI = (hidden: boolean): void => {
    const label = isEn() ? (hidden ? "Hide" : "Show") : hidden ? "隐藏" : "显示";
    btns.forEach((b) => {
      b.textContent = label;
      b.classList.toggle("bg-[var(--link-color)]", hidden);
      b.classList.toggle("text-white", hidden);
      b.classList.toggle("border-[var(--link-color)]", hidden);
    });
  };

  const hidden = localStorage.getItem(storageKey) === "true";
  document.documentElement.classList.toggle(COLLAPSE_CLASS, hidden);
  syncUI(hidden);

  btns.forEach((b) => {
    b.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      if (b.closest("summary")) e.preventDefault();
      const now = !document.documentElement.classList.contains(COLLAPSE_CLASS);
      document.documentElement.classList.toggle(COLLAPSE_CLASS, now);
      localStorage.setItem(storageKey, String(now));
      syncUI(now);
    };
  });
}
