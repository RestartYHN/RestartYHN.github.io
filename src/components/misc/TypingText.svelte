<script lang="ts">
    import { onMount } from 'svelte';

    export let lines: string[] = [];
    export let pairs: Array<{ subTitle: string; credit: string }> = [];

    let display = '';
    let creditDisplay = '';

    const normalizeText = (value: string) => value.replace(/\s*\/\s*/g, '\n');

    const getRandomIndex = (length: number) => Math.floor(Math.random() * length);

    const setInitialContent = () => {
        if (pairs.length > 0) {
            display = normalizeText(pairs[0]?.subTitle ?? '');
            creditDisplay = pairs[0]?.credit ?? '';
            return;
        }

        if (lines.length > 0) {
            display = normalizeText(lines[0] ?? '');
        }
    };

    setInitialContent();

    onMount(() => {
        const hasPairs = pairs.length > 0;
        const hasLines = lines.length > 0;
        if (!hasPairs && !hasLines) {
            return;
        }

        const selectedIndex = hasPairs ? getRandomIndex(pairs.length) : getRandomIndex(lines.length);

        if (hasPairs) {
            const selectedPair = pairs[selectedIndex];
            display = normalizeText(selectedPair?.subTitle ?? '');
            creditDisplay = selectedPair?.credit ?? '';
            return;
        }

        display = normalizeText(lines[selectedIndex] ?? '');
    });
</script>

<p class="min-h-[1.6em] text-center text-lg md:text-xl font-semibold tracking-wide text-[var(--text-color-70)]">
    <span class="whitespace-pre-line leading-relaxed" aria-live="polite" aria-atomic="true">{display}</span>
</p>

{#if pairs.length > 0}
    <p class="min-h-[1.4em] text-sm md:text-base font-medium tracking-wide text-[var(--text-color-70)] opacity-80 text-center">
        <span class="whitespace-pre-line leading-relaxed" aria-live="polite" aria-atomic="true">{creditDisplay}</span>
    </p>
{/if}