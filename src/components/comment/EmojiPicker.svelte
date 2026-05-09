<script lang="ts">
  import state, { closePicker } from './emojiPickerStore';
  import { onDestroy } from 'svelte';

  const EMOJIS = ['😀','😂','😍','👍','🎉','😮','❤️','🚀','👀','😉','😭','😅','😆','🙌','👏','🔥','🌟','🍀','🍻'];
  const KAOMOJI = ['(๑•́ ₃ •̀๑)','(つω`｡)','｡ﾟ( ﾟஇ‸இﾟ)ﾟ｡','(◕‿◕)','(；´∀｀)','(¯\_(ツ)_/¯)','(ง •̀_•́)ง','OwO','( ͡° ͜ʖ ͡°)'];

  let open = false;
  let callback: ((e: string, target?: HTMLElement | null) => void) | null = null;
  let target: HTMLElement | null = null;
  let activeTab: 'kaomoji' | 'emoji' | 'bilibili' = 'bilibili';

  const BILIBILI_STICKERS = [
    { name: 'doge', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_doge.png' },
    { name: 'sob', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sob.png' },
    { name: 'heart_eyes', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_heart_eyes.png' },
    { name: 'cry', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_cry.png' },
    { name: 'sad', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sad.png' },
    { name: 'smirk', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_smirk.png' },
    { name: 'sweat', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sweat.png' },
    { name: 'antic', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_antic.png' },
    { name: 'clap', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_clap.png' },
    { name: 'confused', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_confused.png' },
    { name: 'cute', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_cute.png' },
    { name: 'money', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_money.png' },
    { name: 'scared', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_scared.png' },
    { name: 'shy', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_shy.png' },
    { name: 'think', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_think.png' },
    { name: 'kiss', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_kiss.png' },
    { name: 'thumbsup', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_thumbsup.png' },
    { name: 'question', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_question_mask.png' },
    { name: 'dizzy', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_dizzy_face.png' },
    { name: 'trollface', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_trollface.png' },
    { name: 'nosebleed', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_nosebleed.png' },
    { name: 'sleep', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sleep.png' },
    { name: 'rage', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_rage.png' },
    { name: 'vomit', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_vomit.png' },
    { name: 'annoyed', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_annoyed.png' },
    { name: 'awkward', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_awkward.png' },
    { name: 'bye', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_bye.png' },
    { name: 'crazy', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_crazy.png' },
    { name: 'flushed', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_flushed.png' },
    { name: 'grievance', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_grievance.png' },
    { name: 'lovely', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_lovely.png' },
    { name: 'rolling_eyes', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_rolling_eyes.png' },
    { name: 'sleepy', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sleepy.png' },
    { name: 'yum', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_yum.png' },
    { name: 'slap', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_slap.png' },
    { name: 'sunglasses', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_sunglasses.png' },
    { name: 'pick_nose', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_pick_nose.png' },
    { name: 'not_care', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_not_care.png' },
    { name: 'chuckle', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_chuckle.png' },
    { name: 'face_cry', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_face_cry.png' },
    { name: 'look_down', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_look_down.png' },
    { name: 'mask', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_mask.png' },
    { name: 'greddy', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_greddy.png' },
    { name: 'spit_blodd', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_spit_blodd.png' },
    { name: 'miantian', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_miantian.png' },
    { name: 'tiaokan', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_tiaokan.png' },
    { name: 'zhoumei', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_zhoumei.png' },
    { name: 'slient', url: 'https://unpkg.com/@waline/emojis@1.1.0/bilibili/bb_slient.png' }
  ];

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
          <button on:click={() => activeTab = 'bilibili'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'bilibili'}>Bilibili</button>
          <button on:click={() => activeTab = 'kaomoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'kaomoji'}>颜文字</button>
          <button on:click={() => activeTab = 'emoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'emoji'}>Emoji</button>
          <div class="flex-1"></div>
          <button on:click={close} class="px-2 py-1 rounded-md">关闭</button>
        </div>

        <div class="mt-3">
          {#if activeTab === 'bilibili'}
            <div class="grid grid-cols-8 gap-2 text-sm overflow-y-auto max-h-[300px]">
              {#each BILIBILI_STICKERS as s}
                <button on:click={() => selectEmoji(`![${s.name}](${s.url})`)} class="p-1 hover:bg-[var(--button-hover-color)] rounded flex items-center justify-center">
                  <img src={s.url} alt={s.name} class="w-[40px] h-[40px] object-contain" />
                </button>
              {/each}
            </div>
          {:else if activeTab === 'kaomoji'}
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
