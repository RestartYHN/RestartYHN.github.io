/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a NetEase Album Card with inline playback.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.id - The NetEase album ID.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created Album Card component.
 */
export function AlbumCardComponent(properties, children) {
    if (Array.isArray(children) && children.length !== 0)
        return h("div", { class: "hidden" }, [
            'Invalid directive. ("album" directive must be leaf type "::album{id=\\"albumId\\"}")',
        ]);

    if (!properties.id)
        return h(
            "div",
            { class: "hidden" },
            'Invalid album id. ("id" attribute must be provided)',
        );

    const albumId = properties.id;
    const cardUuid = `AC${Math.random().toString(36).slice(-6)}`;

    const nCover = h(`div#${cardUuid}-cover`, { class: "album-cover" });
    const nName = h(`div#${cardUuid}-name`, { class: "album-name" }, "Waiting for API...");
    const nArtist = h(`div#${cardUuid}-artist`, { class: "album-artist" }, "Waiting...");
    const nMeta = h(`div#${cardUuid}-meta`, { class: "album-meta" }, "Waiting...");
    const nPlayBtn = h(`button#${cardUuid}-play-btn`, { class: "album-play-btn", disabled: "true" }, "\u25B6 \u64AD\u653E\u4E13\u8F91");

    const nScript = h(
        `script#${cardUuid}-script`,
        { type: "text/javascript" },
        `
        (function() {
            var _albumTracks = null;
            var _playBtnLock = false;

            const initAlbumCard = () => {
                const card = document.getElementById('${cardUuid}-card');
                if (!card || card.dataset.loaded === "true") return;

                const apiBase = (window.__MUSIC_API__ && window.__MUSIC_API__.apiBase) || '';

                fetch(apiBase + '/api/music/album?id=${albumId}', { referrerPolicy: "no-referrer" })
                    .then(response => response.json())
                    .then(result => {
                        if (result.code !== 200 || !result.data) throw new Error("Album not found");
                        const album = result.data;

                        document.getElementById('${cardUuid}-name').innerText = album.name || "\u672A\u77E5\u4E13\u8F91";
                        document.getElementById('${cardUuid}-artist').innerText = album.artist || "\u672A\u77E5\u827A\u672F\u5BB6";

                        const dateStr = album.publishTime
                            ? new Date(album.publishTime).getFullYear() + '-' +
                              String(new Date(album.publishTime).getMonth() + 1).padStart(2, '0') + '-' +
                              String(new Date(album.publishTime).getDate()).padStart(2, '0')
                            : "";
                        document.getElementById('${cardUuid}-meta').innerText =
                            (album.size || 0) + " \u9996" + (dateStr ? " \u00B7 " + dateStr : "");

                        const coverEl = document.getElementById('${cardUuid}-cover');
                        if (coverEl && album.cover) {
                            coverEl.style.backgroundImage = 'url(' + album.cover + '?param=200y200)';
                            coverEl.style.backgroundColor = 'transparent';
                        }

                        card.classList.remove("fetch-waiting");
                        card.dataset.loaded = "true";

                        const playBtn = document.getElementById('${cardUuid}-play-btn');
                        if (playBtn && Array.isArray(album.tracks) && album.tracks.length > 0) {
                            _albumTracks = album.tracks;
                            playBtn.removeAttribute("disabled");
                        } else if (playBtn) {
                            playBtn.innerText = "\u26A0 \u65E0\u66F2\u76EE";
                        }

                        console.log("[ALBUM-CARD] Loaded: ${albumId}");
                    })
                    .catch(err => {
                        card.classList.add("fetch-error");
                        console.warn("[ALBUM-CARD] Error loading ${albumId}:", err);
                        const playBtn = document.getElementById('${cardUuid}-play-btn');
                        if (playBtn) {
                            playBtn.innerText = "\u26A0 \u52A0\u8F7D\u5931\u8D25";
                            playBtn.removeAttribute("disabled");
                        }
                    });
            };

            // delegated click on card body
            document.getElementById('${cardUuid}-card').addEventListener("click", function(e) {
                const playBtn = document.getElementById('${cardUuid}-play-btn');
                if (!playBtn) return;
                if (playBtn.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (_playBtnLock || playBtn.disabled) return;
                    onPlayClick(playBtn);
                    return;
                }
                if (e.ctrlKey || e.metaKey) return;
                e.preventDefault();
                if (_playBtnLock || playBtn.disabled) return;
                onPlayClick(playBtn);
            });

            async function onPlayClick(playBtn) {
                if (!_albumTracks || !_albumTracks.length) return;
                _playBtnLock = true;
                playBtn.innerText = "\u23F3 \u52A0\u8F7D\u4E2D...";

                const apiBase = (window.__MUSIC_API__ && window.__MUSIC_API__.apiBase) || '';
                const ids = _albumTracks.map(function(t) { return t.id; }).filter(Boolean);
                const tracks = [];
                let failed = 0;

                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    try {
                        var r = await fetch(apiBase + '/api/music/track?id=' + id, { referrerPolicy: "no-referrer" });
                        var d = await r.json();
                        if (d.code === 200 && d.data && d.data.audio) {
                            tracks.push(d.data);
                        } else {
                            failed++;
                        }
                    } catch (err) {
                        failed++;
                        console.warn("[ALBUM-CARD] Failed to load track:", id, err);
                    }
                }

                if (!tracks.length) {
                    playBtn.innerText = "\u26A0 \u65E0\u53EF\u64AD\u653E\u66F2\u76EE";
                    _playBtnLock = false;
                    return;
                }

                var gc = window.__globalMusicBootstrapV1;
                if (gc && typeof gc.syncState === "function") {
                    gc.syncState({ tracks: tracks, currentIndex: 0 });
                }

                setTimeout(function() {
                    var audio = document.getElementById("music-audio");
                    if (audio) {
                        audio.removeAttribute("crossorigin");
                        audio.crossOrigin = null;
                        if (typeof audio.play === "function") {
                            audio.play().catch(console.warn);
                        }
                    }
                }, 100);

                playBtn.innerText = "\u25B6 \u64AD\u653E\u4E2D  (" + tracks.length + "/" + (tracks.length + failed) + ")";
                _playBtnLock = false;
            }

            initAlbumCard();
            document.addEventListener('astro:page-load', initAlbumCard);
        })();
        `
    );

    return h(
        `a#${cardUuid}-card`,
        {
            class: "card-album fetch-waiting no-styling",
            href: `https://music.163.com/#/album?id=${albumId}`,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-album-id": albumId,
        },
        [
            h("div", { class: "album-card" }, [
                h("div", { class: "album-cover-wrapper", id: `${cardUuid}-cover-wrapper` }, [
                    nCover,
                    h("div", { class: "album-play-hover" }, "\u25B6"),
                ]),
                h("div", { class: "album-info" }, [
                    nName,
                    nArtist,
                    nMeta,
                    nPlayBtn,
                ]),
            ]),
            nScript,
        ],
    );
}
