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

    const nScript = h(
        `script#${cardUuid}-script`,
        { type: "text/javascript" },
        `
        (function() {
            var _albumTracks = null;
            var _loading = false;

            const initAlbumCard = () => {
                const card = document.getElementById('${cardUuid}-card');
                if (!card || card.dataset.loaded === "true") return;

                const apiBase = (window.__MUSIC_API__ && window.__MUSIC_API__.apiBase) || '';

                Promise.all([
                    fetch(apiBase + '/api/music/albums', { referrerPolicy: "no-referrer" }),
                    fetch(apiBase + '/api/music/album?id=${albumId}', { referrerPolicy: "no-referrer" })
                ])
                    .then(function(responses) { return Promise.all(responses.map(function(r) { return r.json(); })); })
                    .then(function(results) {
                        var albumsResult = results[0];
                        var detailResult = results[1];

                        if (detailResult.code !== 200 || !detailResult.data)
                            throw new Error("Album detail not found");

                        var tracks = detailResult.data.tracks;
                        if (!Array.isArray(tracks)) tracks = [];

                        var meta = null;
                        if (albumsResult.code === 200 && Array.isArray(albumsResult.data)) {
                            meta = albumsResult.data.find(function(a) { return String(a.id) === String('${albumId}'); });
                        }

                        var name = (meta && meta.name) || (detailResult.data && detailResult.data.name) || "\u672A\u77E5\u4E13\u8F91";
                        var artist = (meta && meta.artist) || (detailResult.data && detailResult.data.artist) || "\u672A\u77E5\u827A\u672F\u5BB6";
                        var cover = (meta && meta.cover) || (detailResult.data && detailResult.data.cover) || "";
                        var size = (meta && meta.size) || (detailResult.data && detailResult.data.size) || tracks.length;
                        var publishTime = (meta && meta.publishTime) || (detailResult.data && detailResult.data.publishTime) || null;

                        document.getElementById('${cardUuid}-name').innerText = name;
                        document.getElementById('${cardUuid}-artist').innerText = artist;

                        var dateStr = publishTime
                            ? new Date(publishTime).getFullYear() + '-' +
                              String(new Date(publishTime).getMonth() + 1).padStart(2, '0') + '-' +
                              String(new Date(publishTime).getDate()).padStart(2, '0')
                            : "";
                        document.getElementById('${cardUuid}-meta').innerText =
                            size + " \u9996" + (dateStr ? " \u00B7 " + dateStr : "");

                        var coverEl = document.getElementById('${cardUuid}-cover');
                        if (coverEl && cover) {
                            coverEl.style.backgroundImage = 'url(' + cover + '?param=200y200)';
                            coverEl.style.backgroundColor = 'transparent';
                        }

                        if (tracks.length > 0) _albumTracks = tracks;
                        card.classList.remove("fetch-waiting");
                        card.dataset.loaded = "true";

                        console.log("[ALBUM-CARD] Loaded: ${albumId}");
                    })
                    .catch(function(err) {
                        card.classList.add("fetch-error");
                        console.warn("[ALBUM-CARD] Error loading ${albumId}:", err);
                    });
            };

            document.getElementById('${cardUuid}-card').addEventListener("click", function(e) {
                if (e.ctrlKey || e.metaKey) return;
                e.preventDefault();
                if (_loading || !_albumTracks || !_albumTracks.length) return;
                _loading = true;

                const apiBase = (window.__MUSIC_API__ && window.__MUSIC_API__.apiBase) || '';
                const ids = _albumTracks.map(function(t) { return t.id; }).filter(Boolean);
                const tracks = [];

                (async function() {
                    for (var i = 0; i < ids.length; i++) {
                        var id = ids[i];
                        try {
                            var r = await fetch(apiBase + '/api/music/track?id=' + id, { referrerPolicy: "no-referrer" });
                            var d = await r.json();
                            if (d.code === 200 && d.data && d.data.audio) {
                                tracks.push(d.data);
                            }
                        } catch (err) {
                            console.warn("[ALBUM-CARD] Failed to load track:", id, err);
                        }
                    }

                    if (!tracks.length) { _loading = false; return; }

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

                    _loading = false;
                })();
            });

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
                ]),
            ]),
            nScript,
        ],
    );
}
