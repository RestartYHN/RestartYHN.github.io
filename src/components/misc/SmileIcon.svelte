<script lang="ts">
  // Giscus-style line smiley icon: 1.5px stroke, currentColor, no emoji font.
  // Used by the "add reaction" triggers in memos and comments so the glyph
  // looks identical on every platform (emoji fonts differ per OS).
  let { size = 16, className = "" }: { size?: number; className?: string } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="9" />
  <circle cx="8.8" cy="9.9" r="0.85" fill="currentColor" stroke="none" />
  <circle cx="15.2" cy="9.9" r="0.85" fill="currentColor" stroke="none" />
  <path d="M8.2 14.15c1 1.45 6.6 1.45 7.6 0" />
</svg>
