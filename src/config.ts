import type {
    SiteConfig,
    ProfileConfig,
    LicenseConfig
} from "./types/config"

import type { FriendLink } from "./types/friend"

export interface ExternalLinkItem {
    title: {
        "zh-cn": string;
        en: string;
    };
    url: string;
    description: {
        "zh-cn": string;
        en: string;
    };
    tag: string;
    enabled?: boolean;
    order?: number;
}

export interface FindMeAccountItem {
    platform: string;
    account: string;
    url: string;
    description?: {
        "zh-cn": string;
        en: string;
    };
    enabled?: boolean;
    order?: number;
}

const commentsBackendUrl =
    (import.meta as any).env?.PUBLIC_COMMENTS_API || "https://momo-backend-worker.478929164.workers.dev";

export const siteConfig: SiteConfig = {
    title: "RestartYHN",
    subTitle: "Hello!",

    favicon: "/favicon/favicon.ico", // Path of the favicon, relative to the /public directory

    pageSize: 6, // Number of posts per page
    toc: {
        enable: true,
        depth: 3 // Max depth of the table of contents, between 1 and 4
    },
    blogNavi: {
        enable: true // Whether to enable blog navigation in the blog footer
    },
    comments: {
        enable: true, // Whether to enable comments
        backendUrl: commentsBackendUrl // Backend URL for comments
    }
}

export const profileConfig: ProfileConfig = {
    avatar: "assets/Motues.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    name: "RestartYHN",
    description: "Life is colorful!",
    indexPage: "https://restartyhn.github.io",
    startYear: 2024,
}

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const friendLinkConfig: FriendLink[] = [
    {
        name: 'Motues',
        avatar: 'https://avatars.githubusercontent.com/u/164032838',
        url: 'https://motues.top',
        description: 'Like River!'
    },
    {
        name: 'Astro',
        avatar: 'https://avatars.githubusercontent.com/u/44914786',
        url: 'https://astro.build',
        description: 'Build fast websites, faster.'
    }
    // Add more friend links here
]

export const externalLinkConfig: ExternalLinkItem[] = [
    {
        title: {
            "zh-cn": "GitHub",
            en: "GitHub"
        },
        url: "https://github.com/RestartYHN",
        description: {
            "zh-cn": "我的开源仓库与项目记录",
            en: "My open-source projects and notes"
        },
        tag: "Code",
        enabled: true,
        order: 1
    },
    {
        title: {
            "zh-cn": "Astro",
            en: "Astro"
        },
        url: "https://astro.build",
        description: {
            "zh-cn": "本博客使用的框架",
            en: "The framework used by this blog"
        },
        tag: "Tech",
        enabled: true,
        order: 2
    },
    {
        title: {
            "zh-cn": "Cloudflare Workers",
            en: "Cloudflare Workers"
        },
        url: "https://workers.cloudflare.com/",
        description: {
            "zh-cn": "用于后端 API 的无服务器平台",
            en: "Serverless platform for backend APIs"
        },
        tag: "Infra",
        enabled: true,
        order: 3
    }
]

export const findMeAccounts: FindMeAccountItem[] = [
    {
        platform: "QQ",
        account: "180356381",
        url: "mqqapi://card/show_pslcard?src_type=internal&version=1&uin=180356381&card_type=person&source=external",
        description: {
            "zh-cn": "拉起 QQ 客户端并打开个人资料",
            en: "Open QQ app and jump to profile"
        },
        enabled: true,
        order: 1
    },
    {
        platform: "QZone",
        account: "180356381",
        url: "https://user.qzone.qq.com/180356381",
        description: {
            "zh-cn": "QQ 空间主页（Web/PC）",
            en: "QZone profile (Web/PC)"
        },
        enabled: true,
        order: 2
    },
    {
        platform: "Bilibili",
        account: "499205919",
        url: "https://space.bilibili.com/499205919?spm_id_from=333.1007.0.0",
        description: {
            "zh-cn": "B 站主页",
            en: "Bilibili profile"
        },
        enabled: true,
        order: 3
    },
    {
        platform: "NetEase Music",
        account: "2112672342",
        url: "https://music.163.com/#/user/home?id=2112672342",
        description: {
            "zh-cn": "网易云音乐主页",
            en: "NetEase Cloud Music profile"
        },
        enabled: true,
        order: 4
    },
    {
        platform: "Steam",
        account: "76561199866224092",
        url: "https://steamcommunity.com/profiles/76561199866224092/",
        description: {
            "zh-cn": "Steam 个人资料",
            en: "Steam profile"
        },
        enabled: true,
        order: 5
    },
    {
        platform: "GitHub",
        account: "RestartYHN",
        url: "https://github.com/RestartYHN",
        description: {
            "zh-cn": "GitHub 主页",
            en: "GitHub profile"
        },
        enabled: true,
        order: 6
    }
]