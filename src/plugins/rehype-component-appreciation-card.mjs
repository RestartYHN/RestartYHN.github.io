/// <reference types="mdast" />
import { h } from "hastscript";

export function AppreciationCardComponent(properties, children) {
  if (Array.isArray(children) && children.length !== 0)
    return h("div", { class: "hidden" }, [
      'Invalid directive. ("appreciation" directive must be leaf type "::appreciation{slug=\\"xxx\\"}")',
    ]);

  if (!properties.slug)
    return h(
      "div",
      { class: "hidden" },
      'Invalid slug. ("slug" attribute must be provided)',
    );

  const slug = properties.slug;
  const cardUuid = `AC${Math.random().toString(36).slice(-6)}`;

  const nTitle = h(
    `span#${cardUuid}-title`,
    { class: "ref-card-title" },
    slug,
  );
  const nMeta = h(
    `span#${cardUuid}-meta`,
    { class: "ref-card-meta" },
    "Loading...",
  );
  const nDesc = h(
    `span#${cardUuid}-desc`,
    { class: "ref-card-desc" },
    "",
  );

  const nScript = h(
    `script#${cardUuid}-script`,
    { type: "text/javascript" },
    `(function(){var fill=function(){var card=document.getElementById('${cardUuid}-card');if(!card||card.dataset.loaded==="true")return;var key="__MOMO_SEARCH_INDEX__";var p=window[key]=window[key]||fetch("/search-index.json").then(function(r){return r.json()}).catch(function(){return[]});p.then(function(data){var lang=document.documentElement.lang||"zh-cn";var entry=data.find(function(d){return d.type==="appreciation"&&d.id.startsWith("appreciation-")&&d.id.includes("-${slug}-")&&d.lang===lang})||data.find(function(d){return d.type==="appreciation"&&d.id.startsWith("appreciation-")&&d.id.includes("-${slug}-")});if(entry){var titleEl=document.getElementById("${cardUuid}-title");if(titleEl)titleEl.textContent=entry.title;var metaEl=document.getElementById("${cardUuid}-meta");if(metaEl){var parts=[];if(entry.date){var d_=new Date(entry.date);parts.push(d_.getFullYear()+"\\u5e74"+(d_.getMonth()+1)+"\\u6708"+d_.getDate()+"\\u65e5")}if(entry.tags&&entry.tags[0])parts.push(entry.tags[0]);metaEl.textContent=parts.join(" \\u00b7 ")}var descEl=document.getElementById("${cardUuid}-desc");if(descEl&&entry.description)descEl.textContent=entry.description;card.href=entry.url||card.href;card.dataset.loaded="true";card.classList.remove("fetch-waiting");console.log("[APPRECIATION-CARD] Loaded ${slug}")}else{card.classList.add("fetch-error")}}).catch(function(){card.classList.add("fetch-error")})};fill();document.addEventListener("astro:page-load",fill)})();`,
  );

  return h(
    `a#${cardUuid}-card`,
    {
      class: "card-ref appreciation-ref-card fetch-waiting no-styling",
      href: `/appreciation/articles/${slug}/`,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-post-slug": slug,
    },
    [
      h("div", { class: "ref-card-body" }, [
        h("div", { class: "ref-card-header" }, [nTitle, nMeta]),
        nDesc,
      ]),
      nScript,
    ],
  );
}
