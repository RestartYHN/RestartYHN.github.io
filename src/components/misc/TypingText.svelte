<script lang="ts">
    import { onMount } from 'svelte';

    export let lines: string[] = [];
    export let pairs: Array<{ subTitle: string; credit: string }> = [];
    export let typingSpeed = 90;
    export let deletingSpeed = 45;
    export let pauseMs = 2000;
    export let loopDelay = 180;

    let display = '';
    let creditDisplay = '';
    let timer: number | undefined = undefined;

    const sleep = (ms: number) => new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
    });

    onMount(() => {
        const hasPairs = pairs.length > 0;
        const hasLines = lines.length > 0;
        if (!hasPairs && !hasLines) {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            if (hasPairs) {
                display = pairs[0]?.subTitle ?? '';
                creditDisplay = pairs[0]?.credit ?? '';
            } else {
                display = lines[0] ?? '';
            }
            return;
        }

        let active = true;

        const run = async () => {
            while (active) {
                if (hasPairs) {
                    for (const pair of pairs) {
                        if (!active) {
                            return;
                        }

                        const current = pair.subTitle ?? '';
                        const currentCredit = pair.credit ?? '';
                        const maxLen = Math.max(current.length, currentCredit.length);
                        display = '';
                        creditDisplay = '';

                        for (let index = 1; index <= maxLen && active; index += 1) {
                            display = current.slice(0, index);
                            creditDisplay = currentCredit.slice(0, index);
                            await sleep(typingSpeed);
                        }

                        if (!active) {
                            return;
                        }

                        await sleep(pauseMs);

                        for (let index = maxLen - 1; index >= 0 && active; index -= 1) {
                            display = current.slice(0, index);
                            creditDisplay = currentCredit.slice(0, index);
                            await sleep(deletingSpeed);
                        }

                        if (!active) {
                            return;
                        }

                        await sleep(loopDelay);
                    }

                    continue;
                }

                for (const line of lines) {
                    if (!active) {
                        return;
                    }

                    const current = line ?? '';
                    display = '';
                    creditDisplay = '';

                    for (let index = 1; index <= current.length && active; index += 1) {
                        display = current.slice(0, index);
                        await sleep(typingSpeed);
                    }

                    if (!active) {
                        return;
                    }

                    await sleep(pauseMs);

                    for (let index = current.length - 1; index >= 0 && active; index -= 1) {
                        display = current.slice(0, index);
                        await sleep(deletingSpeed);
                    }

                    if (!active) {
                        return;
                    }

                    await sleep(loopDelay);
                }
            }
        };

        void run();

        return () => {
            active = false;
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    });
</script>

<p class="flex min-h-[1.6em] items-center justify-center text-[var(--text-color-70)] text-lg md:text-xl font-semibold tracking-wide text-center">
    <span aria-live="polite" aria-atomic="true">{display}</span>
    <span class="ml-1 inline-block select-none text-[var(--link-color)] animate-pulse" aria-hidden="true">|</span>
</p>

{#if pairs.length > 0}
    <p class="min-h-[1.4em] text-sm md:text-base font-medium tracking-wide text-[var(--text-color-70)] opacity-80 text-center">
        <span aria-live="polite" aria-atomic="true">{creditDisplay}</span>
    </p>
{/if}