/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a NetEase Music Card.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.id - The NetEase Music song ID.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created NetEase Music Card component.
 */
export function MusicCardComponent(properties, children) {
    if (Array.isArray(children) && children.length !== 0)
        return h("div", { class: "hidden" }, [
            'Invalid directive. ("music" directive must be leaf type "::music{id="songId"}")',
        ]);

    if (!properties.id)
        return h(
            "div",
            { class: "hidden" },
            'Invalid song id. ("id" attribute must be provided)',
        );

    const songId = properties.id;
    const cardUuid = `MC${Math.random().toString(36).slice(-6)}`;

    const nCover = h(`div#${cardUuid}-cover`, { class: "music-cover" });
    const nTitle = h(`div#${cardUuid}-title`, { class: "music-title" }, "Waiting for API...");
    const nArtist = h(`div#${cardUuid}-artist`, { class: "music-artist" }, "Waiting...");

    const nScript = h(
        `script#${cardUuid}-script`,
        { type: "text/javascript" },
        `
        (function() {
            const initMusicCard = () => {
                const card = document.getElementById('${cardUuid}-card');
                // 幂等性检查：如果卡片不存在，或已经标记为加载完成，则不再执行
                if (!card || card.dataset.loaded === "true") return;

                const apiBase = (window.__MUSIC_API__ && window.__MUSIC_API__.apiBase) || '';

                fetch(apiBase + '/api/music/track?id=${songId}', { referrerPolicy: "no-referrer" })
                    .then(response => response.json())
                    .then(result => {
                        if (result && result.code === 200 && result.data) {
                            const track = result.data;
                            
                            // 更新标题
                            const titleEl = document.getElementById('${cardUuid}-title');
                            if (titleEl) titleEl.innerText = track.title || "未知曲目";

                            // 更新艺术家 (多名歌手需要合并)
                            const artistEl = document.getElementById('${cardUuid}-artist');
                            const artistName = track.artist || '未知艺术家';
                            if (artistEl) artistEl.innerText = artistName;

                            // 更新封面 (直接通过 api 返回的数据取出，不再需要请求另一次)
                            const coverEl = document.getElementById('${cardUuid}-cover');
                            if (coverEl && track.cover) {
                                coverEl.style.backgroundImage = 'url(' + track.cover + '?param=130y130)'; // 附加缩放参数节省流量
                                coverEl.style.backgroundColor = 'transparent';
                            }

                            // 移除等待状态并加锁
                            card.classList.remove("fetch-waiting");
                            card.dataset.loaded = "true";
                            console.log("[MUSIC-CARD] Loaded: ${songId}");

                            // 绑定点击事件：拦截默认跳转，联动全局悬浮播放器
                            card.addEventListener("click", function(e) {
                                // 如果按下 Ctrl/Command 则保持原行为(新标签页打开)
                                if (e.ctrlKey || e.metaKey) return;
                                
                                e.preventDefault();
                                const globalController = window.__globalMusicBootstrapV1;
                                if (globalController && typeof globalController.syncState === "function") {
                                    const state = typeof globalController.getState === "function" ? globalController.getState() : null;
                                    
                                    const newTrack = {
                                        id: "${songId}",
                                        title: track.title || "未知曲目",
                                        artist: artistName,
                                        cover: track.cover || "",
                                        lyric: track.lyric || "",
                                        tlyric: track.tlyric || "",
                                        audio: track.audio || "https://music.163.com/song/media/outer/url?id=${songId}.mp3"
                                    };

                                    if (state && Array.isArray(state.tracks) && state.tracks.length > 0) {
                                        // 把这首歌插到当前播放位置的下一首
                                        const tracks = [...state.tracks];
                                        const existsIndex = tracks.findIndex(t => String(t.id) === String(newTrack.id));
                                        
                                        if (existsIndex !== -1) {
                                            // 如果列表里已经有这首歌，直接跳过去
                                            globalController.syncState({ tracks, currentIndex: existsIndex });
                                        } else {
                                            // 插入下一首
                                            tracks.splice(state.currentIndex + 1, 0, newTrack);
                                            globalController.syncState({ tracks, currentIndex: state.currentIndex + 1 });
                                        }
                                    } else {
                                        // 全局播放器当前没歌，直接初始化
                                        globalController.syncState({ tracks: [newTrack], currentIndex: 0 });
                                    }

                                    // 模拟自动播放
                                    setTimeout(() => {
                                        const audio = document.getElementById("music-audio");
                                        if (audio) {
                                            // 【修复 CORS 问题】移除 audio 的跨域限制，允许直接播放网易云重定向的无 CORS 头的媒体资源
                                            audio.removeAttribute("crossorigin");
                                            audio.crossOrigin = null;

                                            if (typeof audio.play === "function" && audio.paused) {
                                                audio.play().catch(console.warn);
                                            }
                                        }
                                    }, 50);
                                }
                            });
                        }
                    })
                    .catch(err => {
                        const cardEl = document.getElementById('${cardUuid}-card');
                        cardEl?.classList.add("fetch-error");
                        console.warn("[MUSIC-CARD] Error loading ${songId}:", err);
                    });
            };

            initMusicCard();
            document.addEventListener('astro:page-load', initMusicCard);
        })();
        `
    );

    return h(
        `a#${cardUuid}-card`,
        {
            class: "card-music fetch-waiting no-styling",
            "data-song-id": songId,
            href: `https://music.163.com/#/song?id=${songId}`, 
            target: "_blank", 
            rel: "noopener noreferrer" 
        },
        [
            h("div", { class: "music-card" }, [
                // 左侧封面图
                h("div", { class: "music-cover-wrapper", id: `${cardUuid}-cover-wrapper` }, [
                    nCover,
                ]),
                // 右侧信息区
                h("div", { class: "music-info" }, [
                    h("div", { class: "music-header" }, [
                        nTitle,
                        nArtist,
                    ]),
                ])
            ]),
            nScript,
        ],
    );
}
