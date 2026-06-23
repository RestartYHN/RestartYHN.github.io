// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from 'astro-icon';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeExternalLinks from 'rehype-external-links';
import remarkDirective from 'remark-directive';
import rehypeComponents from "rehype-components";

import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { MusicCardComponent } from "./src/plugins/rehype-component-music-card.mjs";
import { GithubCardComponent } from './src/plugins/rehype-component-github-card.mjs';
import { AlbumCardComponent } from "./src/plugins/rehype-component-album-card.mjs";
import { BlogCardComponent } from "./src/plugins/rehype-component-blog-card.mjs";
import { AppreciationCardComponent } from "./src/plugins/rehype-component-appreciation-card.mjs";
import { QuoteComponent } from "./src/plugins/rehype-component-quote.mjs"
import { customFigurePlugin } from "./src/plugins/rehype-figure-plugin.mjs";
import { remarkCombined } from './src/plugins/remark-combined.mjs';
import { remarkTypst } from './src/plugins/remark-typst.mjs';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';
import { remarkLqip } from './src/plugins/remark-lqip.js';

import svelte from "@astrojs/svelte";


// https://astro.build/config
export default defineConfig({
  site: 'https://restartyhn.github.io', // Root URL of site
  i18n: {
    locales: ['zh-cn', 'en'],
    defaultLocale: 'zh-cn',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false
    }
  },
  integrations: [icon({
    include: {
      "fa6-brands": ["*"],
      "fa6-solid": ["*"],
      "simple-icons": ["*"],
      "vscode-icons": ["*"],
      "material-symbols": ["*"]
    }
  }), svelte()],
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
    },
    remarkPlugins: [
      remarkMath,
      remarkReadingTime,
      remarkDirective,
      remarkTypst,
      parseDirectiveNode,
      remarkCombined,
      [remarkLqip, { enable: true }]
    ],
    rehypePlugins: [
      rehypeKatex,
      [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }],
      customFigurePlugin,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            music: MusicCardComponent,
            album: AlbumCardComponent,
            blog: BlogCardComponent,
            appreciation: AppreciationCardComponent,
            quote: QuoteComponent,
            note: (x, y) => AdmonitionComponent(x, y, "note"),
            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
            important: (x, y) => AdmonitionComponent(x, y, "important"),
            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
          },
        },
      ],
    ]
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "@iconify/svelte",
        "svelte",
        "svelte/transition",
        "marked",
        "fuse.js",
        "photoswipe",
        "pinyin-pro",
      ],
    },
    server: {
      warmup: {
        clientFiles: [
          "src/layouts/Layout.astro",
          "src/components/Header.astro",
          "src/components/misc/GlobalMusicPlayer.astro",
          "src/components/misc/Search.astro",
          "src/components/control/ThemeIcon.astro",
        ],
      },
    },
    build: {
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
    esbuildOptions: {
      drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  }
});
