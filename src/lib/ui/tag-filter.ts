export interface TagFilterOptions {
  /** Ids of the filter containers (mobile and desktop). */
  containerIds: string[];
  /** Ids of the AND/OR mode toggle buttons. */
  modeToggleIds: string[];
  /** Ids of the "N selected" counters, if the page has any. */
  selectedCountIds?: string[];
  /** localStorage key holding the persisted AND/OR mode. */
  storageKey?: string;
}

const TAG_GRID_SELECTOR = "#gallery-grid article";
const ACTIVE_BG = "bg-[var(--link-color)]";
const INACTIVE_BORDER = "border-[var(--button-border-color)]";
const INACTIVE_TEXT = "text-[var(--text-color-70)]";

/**
 * Wires the tag filter shared by the appreciation gallery pages:
 * collapsible dim/letter groups, AND/OR mode (persisted), and filtering
 * `#gallery-grid` articles by their `data-tags` attribute.
 */
export function initTagFilter(options: TagFilterOptions): void {
  const { containerIds, modeToggleIds, selectedCountIds = [], storageKey = "momo-gallery-filter-mode" } = options;

  const containers = containerIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  if (containers.length === 0) return;

  const unbound = containers.filter((c) => c.dataset.bound !== "true");
  if (unbound.length === 0) return;
  unbound.forEach((c) => {
    c.dataset.bound = "true";
  });

  unbound.forEach((filterBar) => {
    filterBar.querySelectorAll<HTMLElement>("[data-dim-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.nextElementSibling?.classList.toggle("hidden");
      });
    });
    filterBar.querySelectorAll<HTMLElement>("[data-letter-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.nextElementSibling?.classList.toggle("hidden");
      });
    });
  });

  const allBtns = containers.flatMap((c) => [...c.querySelectorAll<HTMLElement>(".tag-filter-btn")]);
  const articles = document.querySelectorAll<HTMLElement>(TAG_GRID_SELECTOR);
  const selected = new Set<string>();
  let useOr = localStorage.getItem(storageKey) === "or";

  const countEls = selectedCountIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  const modeToggles = modeToggleIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  const paintMode = (): void => {
    modeToggles.forEach((b) => {
      b.textContent = useOr ? "OR" : "AND";
      b.classList.toggle(ACTIVE_BG, useOr);
      b.classList.toggle("text-white", useOr);
      b.classList.toggle("border-[var(--link-color)]", useOr);
    });
  };

  const setActive = (el: HTMLElement, active: boolean): void => {
    el.classList.toggle(ACTIVE_BG, active);
    el.classList.toggle("text-white", active);
    el.classList.toggle("border-[var(--link-color)]", active);
    el.classList.toggle(INACTIVE_BORDER, !active);
    el.classList.toggle(INACTIVE_TEXT, !active);
  };

  const applyFilter = (): void => {
    containers.forEach((filterBar) => {
      const allBtn = filterBar.querySelector<HTMLElement>('[data-tag=""]');
      const tagBtns = filterBar.querySelectorAll<HTMLElement>('[data-tag]:not([data-tag=""])');
      if (!allBtn) return;

      setActive(allBtn, selected.size === 0);
      tagBtns.forEach((b) => {
        setActive(b, selected.size > 0 && selected.has(b.dataset.tag ?? ""));
      });
    });

    countEls.forEach((el) => {
      el.classList.toggle("hidden", selected.size === 0);
      if (selected.size > 0) {
        el.textContent = `· ${selected.size} ${document.documentElement.lang === "en" ? "selected" : "已选"}`;
      }
    });

    articles.forEach((article) => {
      if (selected.size === 0) {
        article.style.display = "";
        return;
      }
      const tags: string[] = JSON.parse(article.dataset.tags || "[]");
      const match = useOr
        ? Array.from(selected).some((t) => tags.includes(t))
        : Array.from(selected).every((t) => tags.includes(t));
      article.style.display = match ? "" : "none";
    });
  };

  paintMode();

  modeToggles.forEach((t) => {
    t.addEventListener("click", () => {
      useOr = !useOr;
      localStorage.setItem(storageKey, useOr ? "or" : "and");
      paintMode();
      applyFilter();
    });
  });

  allBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      if (!tag) selected.clear();
      else if (selected.has(tag)) selected.delete(tag);
      else selected.add(tag);
      applyFilter();
    });
  });
}
