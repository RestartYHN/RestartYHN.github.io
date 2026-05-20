<script lang="ts">
  import state, { closePicker } from './emojiPickerStore';
  import { onDestroy } from 'svelte';

  const EMOJIS = ['😀','😂','😍','👍','🎉','😮','❤️','🚀','👀','😉','😭','😅','😆','🙌','👏','🔥','🌟','🍀'];
  const KAOMOJI = ['(๑•́ ₃ •̀๑)','(つω`｡)','｡ﾟ( ﾟஇ‸இﾟ)ﾟ｡','(◕‿◕)','(；´∀｀)','(¯\_(ツ)_/¯)','*^_^* ','OwO','( ͡° ͜ʖ ͡°)','(¬‿¬)','(•_•)','[・_・?]','Ciallo～(∠・ω< )⌒☆','( ゜- ゜)つロ','(/ω＼*)','Orz'];

  let open = false;
  let callback: ((e: string, target?: HTMLElement | null) => void) | null = null;
  let target: HTMLElement | null = null;
  let activeTab: 'kaomoji' | 'emoji' | 'huanglian' | 'tv' = 'huanglian';

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

  const HUANGLIAN = [
    { name: 'doge', file: 'doge.png' },
    { name: 'OK', file: 'OK.png' },
    { name: '亲亲', file: '亲亲.png' },
    { name: '保佑', file: '保佑.png' },
    { name: '保卫萝卜_哇', file: '保卫萝卜_哇.png' },
    { name: '保卫萝卜_哭哭', file: '保卫萝卜_哭哭.png' },
    { name: '保卫萝卜_白眼', file: '保卫萝卜_白眼.png' },
    { name: '保卫萝卜_笔芯', file: '保卫萝卜_笔芯.png' },
    { name: '保卫萝卜_问号', file: '保卫萝卜_问号.png' },
    { name: '偷笑', file: '偷笑.png' },
    { name: '傲娇', file: '傲娇.png' },
    { name: '再见', file: '再见.png' },
    { name: '冷', file: '冷.png' },
    { name: '初音未来-大笑', file: '初音未来-大笑.png' },
    { name: '加油', file: '加油.png' },
    { name: '口罩', file: '口罩.png' },
    { name: '吃瓜', file: '吃瓜.png' },
    { name: '吐', file: '吐.png' },
    { name: '吓', file: '吓.png' },
    { name: '呆', file: '呆.png' },
    { name: '呲牙', file: '呲牙.png' },
    { name: '哈哈', file: '哈哈.png' },
    { name: '哈欠', file: '哈欠.png' },
    { name: '响指', file: '响指.png' },
    { name: '哦呼', file: '哦呼.png' },
    { name: '哭泣', file: '哭泣.png' },
    { name: '喜极而泣', file: '喜极而泣.png' },
    { name: '喜欢', file: '喜欢.png' },
    { name: '嗑瓜子', file: '嗑瓜子.png' },
    { name: '嘘声', file: '嘘声.png' },
    { name: '嘟嘟', file: '嘟嘟.png' },
    { name: '囧', file: '囧.png' },
    { name: '墨镜', file: '墨镜.png' },
    { name: '大哭', file: '大哭.png' },
    { name: '大笑', file: '大笑.png' },
    { name: '奋斗', file: '奋斗.png' },
    { name: '奸笑', file: '奸笑.png' },
    { name: '妙啊', file: '妙啊.png' },
    { name: '委屈', file: '委屈.png' },
    { name: '嫌弃', file: '嫌弃.png' },
    { name: '害羞', file: '害羞.png' },
    { name: '尴尬', file: '尴尬.png' },
    { name: '干杯', file: '干杯.png' },
    { name: '微笑', file: '微笑.png' },
    { name: '思考', file: '思考.png' },
    { name: '怪我咯', file: '怪我咯.png' },
    { name: '惊喜', file: '惊喜.png' },
    { name: '惊讶', file: '惊讶.png' },
    { name: '打call', file: '打call.png' },
    { name: '抓狂', file: '抓狂.png' },
    { name: '抠鼻', file: '抠鼻.png' },
    { name: '抱拳', file: '抱拳.png' },
    { name: '拥抱', file: '拥抱.png' },
    { name: '捂眼', file: '捂眼.png' },
    { name: '捂脸', file: '捂脸.png' },
    { name: '撇嘴', file: '撇嘴.png' },
    { name: '支持', file: '支持.png' },
    { name: '无语', file: '无语.png' },
    { name: '星星眼', file: '星星眼.png' },
    { name: '来古-呆滞', file: '来古-呆滞.png' },
    { name: '来古-沉思', file: '来古-沉思.png' },
    { name: '来古-注意', file: '来古-注意.png' },
    { name: '来古-疑问', file: '来古-疑问.png' },
    { name: '来古-震撼', file: '来古-震撼.png' },
    { name: '歪嘴', file: '歪嘴.png' },
    { name: '汤圆', file: '汤圆.png' },
    { name: '滑稽', file: '滑稽.png' },
    { name: '灵魂出窍', file: '灵魂出窍.png' },
    { name: '点赞', file: '点赞.png' },
    { name: '热', file: '热.png' },
    { name: '爱心', file: '爱心.png' },
    { name: '牛年', file: '牛年.png' },
    { name: '狗子', file: '狗子.png' },
    { name: '生气', file: '生气.png' },
    { name: '生病', file: '生病.png' },
    { name: '疑惑', file: '疑惑.png' },
    { name: '疼', file: '疼.png' },
    { name: '睦头', file: '睦头.png' },
    { name: '福到了', file: '福到了.png' },
    { name: '笑', file: '笑.png' },
    { name: '笑哭', file: '笑哭.png' },
    { name: '给心心', file: '给心心.png' },
    { name: '羞羞', file: '羞羞.png' },
    { name: '翻白眼', file: '翻白眼.png' },
    { name: '老鼠', file: '老鼠.png' },
    { name: '胜利', file: '胜利.png' },
    { name: '脱单doge', file: '脱单doge.png' },
    { name: '脸红', file: '脸红.png' },
    { name: '藏狐', file: '藏狐.png' },
    { name: '虎年', file: '虎年.png' },
    { name: '调皮', file: '调皮.png' },
    { name: '跪了', file: '跪了.png' },
    { name: '蹲', file: '蹲.png' },
    { name: '辣眼睛', file: '辣眼睛.png' },
    { name: '酸了', file: '酸了.png' },
    { name: '金箍doge', file: '金箍doge.png' },
    { name: '锦鲤', file: '锦鲤.png' },
    { name: '阴险', file: '阴险.png' },
    { name: '难过', file: '难过.png' },
    { name: '雪花', file: '雪花.png' },
    { name: '鸡腿', file: '鸡腿.png' },
    { name: '黑洞', file: '黑洞.png' },
    { name: '鼓掌', file: '鼓掌.png' },
  ];

  const EMOJI_BASE = '/emojis/';

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
          <button on:click={() => activeTab = 'huanglian'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'huanglian'}>黄脸</button>
          <button on:click={() => activeTab = 'tv'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'tv'}>小电视</button>
          <button on:click={() => activeTab = 'kaomoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'kaomoji'}>颜文字</button>
          <button on:click={() => activeTab = 'emoji'} class="px-3 py-1 rounded-md" class:font-semibold={activeTab === 'emoji'}>Emoji</button>
          <div class="flex-1"></div>
          <button on:click={close} class="px-2 py-1 rounded-md">关闭</button>
        </div>

        <div class="mt-3">
          {#if activeTab === 'huanglian'}
            <div class="grid grid-cols-8 gap-2 text-sm overflow-y-auto max-h-[300px]">
              {#each HUANGLIAN as s}
                <button on:click={() => selectEmoji(`![${s.name}](${EMOJI_BASE}${encodeURIComponent(s.file)})`)} class="p-1 hover:bg-[var(--button-hover-color)] rounded flex items-center justify-center" title={s.name}>
                  <img src={`${EMOJI_BASE}${encodeURIComponent(s.file)}`} alt={s.name} class="w-[40px] h-[40px] object-contain" />
                </button>
              {/each}
            </div>
          {:else if activeTab === 'tv'}
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
