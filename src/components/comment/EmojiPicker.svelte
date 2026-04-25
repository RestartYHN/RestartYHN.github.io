<script lang="ts">
  import state, { closePicker } from './emojiPickerStore';
  import { onDestroy } from 'svelte';

  const EMOJIS = ['😀','😂','😍','👍','🎉','😮','❤️','🚀','👀','😉','😭','😅','😆','🙌','👏','🔥','🌟','🍀','🍻'];
  const KAOMOJI = ['(๑•́ ₃ •̀๑)','(つω`｡)','｡ﾟ( ﾟஇ‸இﾟ)ﾟ｡','(◕‿◕)','(；´∀｀)','(¯\_(ツ)_/¯)','(ง •̀_•́)ง','OwO','( ͡° ͜ʖ ͡°)'];

  let open = false;
  let callback: ((e: string, target?: HTMLElement | null) => void) | null = null;
  let target: HTMLElement | null = null;
  let activeTab: 'kaomoji' | 'emoji' = 'kaomoji';

  const unsub = state.subscribe(s => {
    open = s.open;
    callback = s.callback;
    target = s.target ?? null;
  });
  onDestroy(() => unsub());

  function selectEmoji(e: string) {
    if (callback) callback(e, target);
    closePicker();
  }

  function close() {
    closePicker();
  }
</script>

{#if open}
  <div id="emoji-global-picker" class="fixed left-1/2 transform -translate-x-1/2 bottom-24 z-[999999] pointer-events-auto">
    <div class="w-[640px] max-w-[95vw] bg-[var(--bg-color)]/60 backdrop-blur-sm border border-[var(--button-border-color)]/40 rounded-lg shadow-lg overflow-hidden">
      <div class="p-3">
        <div class="flex gap-3 items-center">
          <button on:click={() => activeTab = 'kaomoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'kaomoji'}>颜文字</button>
          <button on:click={() => activeTab = 'emoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'emoji'}>Emoji</button>
          <div class="flex-1"></div>
          <button on:click={close} class="px-2 py-1 rounded-md">关闭</button>
        </div>

        <div class="mt-3">
          {#if activeTab === 'kaomoji'}
            <div class="grid grid-cols-3 gap-2 text-sm">
              {#each KAOMOJI as k}
                <button on:click={() => selectEmoji(k)} class="p-2 text-left hover:bg-[var(--button-hover-color)] rounded">{k}</button>
              {/each}
            </div>
          {:else}
            <div class="grid grid-cols-10 gap-2 text-lg">
              {#each EMOJIS as e}
                <button on:click={() => selectEmoji(e)} class="p-2 hover:bg-[var(--button-hover-color)] rounded">{e}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* minimal local styles; relies on global theme variables */
</style>
