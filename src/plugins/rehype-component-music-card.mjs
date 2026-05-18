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

                // 【需要修改这里】
                // 填入您使用 vercel 部署的 api-enhanced (NeteaseCloudMusicApi) 地址：
                // 注意末尾不要带斜杠，例如 "https://netease-api.yourdomain.com"
                const apiBase = "https://api-enhanced-ashy-nine.vercel.app";

                // 调用 api-enhanced 标准接口获取歌曲详细信息
                fetch(apiBase + '/song/detail?ids=${songId}', { referrerPolicy: "no-referrer" })
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.code === 200 && data.songs && data.songs.length > 0) {
                            const track = data.songs[0];
                            
                            // 更新标题
                            const titleEl = document.getElementById('${cardUuid}-title');
                            if (titleEl) titleEl.innerText = track.name || "未知曲目";
                            
                            // 更新艺术家 (多名歌手需要合并)
                            const artistEl = document.getElementById('${cardUuid}-artist');
                            const artistName = Array.isArray(track.ar) ? track.ar.map(a => a.name).join(', ') : '未知艺术家';
                            if (artistEl) artistEl.innerText = artistName;
                            
                            // 更新封面 (直接通过 api 返回的数据取出，不再需要请求另一次)
                            const coverEl = document.getElementById('${cardUuid}-cover');
                            if (coverEl && track.al && track.al.picUrl) {
                                coverEl.style.backgroundImage = 'url(' + track.al.picUrl + '?param=130y130)'; // 附加缩放参数节省流量
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
                                
                                const globalController = window.__globalMusicBootstrapV1;
                                if (globalController && typeof globalController.syncState === "function") {
                                    e.preventDefault();
                                    
                                    // 给卡片加一点正加载的反馈
                                    card.classList.add("fetch-waiting");
                                    
                                    // 【升级版】：在这里不去写死外链，而是动态调取您自己的接口获取免 302 重定向的直链
                                    fetch(apiBase + '/song/url/v1?id=${songId}&level=standard', { referrerPolicy: "no-referrer" })
                                        .then(res => res.json())
                                        .then(resData => {
                                            card.classList.remove("fetch-waiting");
                                            
                                            let audioUrl = "";
                                            if (resData && resData.data && resData.data[0] && resData.data[0].url) {
                                                audioUrl = resData.data[0].url;
                                                // 如果是 http，根据原系统机制改为 https 避免 mixed-content
                                                if (window.location.protocol === "https:" && audioUrl.startsWith("http://")) {
                                                    audioUrl = audioUrl.replace("http://", "https://");
                                                }
                                            } else {
                                                console.warn("[MUSIC-CARD] Failed to get real URL via API, fallback to outer url.", resData);
                                                // 如果直连接口挂了/获取不到（比如必须VIP的无损），降级回外链方案
                                                audioUrl = "https://music.163.com/song/media/outer/url?id=${songId}.mp3";
                                            }
                                            
                                            const state = typeof globalController.getState === "function" ? globalController.getState() : null;
                                            
                                            const newTrack = {
                                                id: "${songId}",
                                                title: track.name || "未知曲目",
                                                artist: artistName,
                                                cover: track.al && track.al.picUrl ? (track.al.picUrl + "?param=130y130") : "",
                                                audio: audioUrl
                                            };

                                            if (state && Array.isArray(state.tracks)) {
                                                const tracks = [...state.tracks];
                                                const existsIndex = tracks.findIndex(t => String(t.id) === String(newTrack.id));
                                                
                                                if (existsIndex !== -1) {
                                                    // 如果旧纪录里有这首歌，但当时它可能取的是降级的 URL 或者外链，直接在此用真直链覆盖更新一下它的音频属性！
                                                    tracks[existsIndex] = { ...tracks[existsIndex], audio: audioUrl };
                                                    globalController.syncState({ tracks, currentIndex: existsIndex });
                                                } else {
                                                    tracks.splice(state.currentIndex + 1, 0, newTrack);
                                                    globalController.syncState({ tracks, currentIndex: state.currentIndex + 1 });
                                                }
                                            } else {
                                                globalController.syncState({ tracks: [newTrack], currentIndex: 0 });
                                            }

                                            // 自动播放
                                            setTimeout(() => {
                                                const audio = document.getElementById("music-audio");
                                                if (audio && typeof audio.play === "function" && audio.paused) {
                                                    audio.play().catch(console.warn);
                                                }
                                            }, 50);

                                        })
                                        .catch(err => {
                                            card.classList.remove("fetch-waiting");
                                            console.warn("[MUSIC-CARD] Failed to get real URL:", err);
                                        });
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