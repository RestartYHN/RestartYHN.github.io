export interface Translation {
    header: {
        home: string;
        blog: string;
        music: string;
        guestbook: string;
        archive: string;
        about: string;
        friends: string;
        appreciation: string;
        memos: string;
    };
    cover: {
        title: {
            home: string;
            archive: string;
            about: string;
            friends: string;
            memos: string;
            appreciation: string;
        };
        subTitle: {
            home: string;
            archive: string;
            about: string;
            friends: string;
            memos: string;
            appreciation: string;
        };
        rotatingSubTitle: {
            home: string[];
        };
        credit: {
            home: string;
        };
        rotatingPair: {
            home: Array<{
                subTitle: string;
                credit: string;
            }>;
        };
    };
    toc:string;
    category: string;
    pageNavigation: {
        previous: string;
        next: string;
        currentPage: string;
    };
    button: {
        switchDarkMode: string;
        backToTop: string;
        backToBottom: string;
        meun: string;
        toc: string;
        backToComments: string;
        cursorToggle: string;
    }
    search: {
        placeholder: string;
        noresult: string;
        error: string;
    };
    license: {
        author: string;
        license: string;
        publishon: string;
    };
    blogNavi: {
        next: string;
        prev: string;
    },
    pagecard: {
        words: string;
        minutes: string;
        uncategorized: string;
    }
    comments: {
        name: string;
        email: string;
        site: string;
        required: string;
        optional: string;
        welcome: string;
        comments: string;
        cancel: string;
        send: string;
        sending: string;
        reply: string;
        replyPlaceholder: string;
        loadMore: string;
        loading: string;
        loadFailed: string;
        submitSuccess: string;
        submitFailed: string;
        fillRequired: string;
        confirmDelete: string;
        delete: string;
        deleteSuccess: string;
        deleteFailed: string;
        deleteError: string;
        characters: string;
        words: string;
        contentTooLong: string;
        replyTo: string;
        like: string;
        unlike: string;
        likeFailed: string;
        write: string;
        preview: string;
        sortByTime: string;
        sortByLikes: string;
        showMoreReplies: string;
        collapseReplies: string;
        image: string;
        uploadingImage: string;
        emoji: string;
    },
    emoji: {
        close: string;
        default: string;
        bilibili: string;
        kaomoji: string;
        emoji: string;
    },
    qa: {
        title: string;
        askQuestion: string;
        questionPlaceholder: string;
        name: string;
        email: string;
        submit: string;
        submitting: string;
        submitSuccess: string;
        submitFailed: string;
        fillRequired: string;
        loadFailed: string;
        loading: string;
        empty: string;
        total: string;
        pending: string;
    },
    langNote: {
        note: string;
        description: string;
    },
    draftNote: {
        warning: string;
        description: string;
    },
    page404: {
        title: string;
        subTitle: string;
        backToHome: string;
        backToPreview: string;
        errorCode: string;
        notice: string;
    },
    themeInfo: {
        light: string;
        dark: string;
        system: string;
    },
    memoCard: {
        words: string;
        minutes: string;
        expanded: string;
        collapsed: string;
    }
}