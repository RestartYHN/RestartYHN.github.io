import type { Translation } from "@i18n/key";

const translation: Translation = {
    header: {
        home: "Home",
        blog: "Blog",
        music: "Music",
        guestbook: "Guestbook",
        archive: "Archive",
        about: "About",
        friends: "Friends",
        appreciation: "Appreciation",
        memos: "Memos",
    },
    cover: {
        title: {
            home: "Welcome to Restart's Blog",
            archive: "Archive",
            about: "About",
            friends: "Friends",
            memos: "Memos",
            appreciation: "Appreciation",
        },
        subTitle: {
            home: "It will get better by tomorrow.",
            archive: "Collections of config guides and personal blogs",
            about: "Personal introduction and update log",
            friends: "Friend links and personal external link recommendations",
            memos: "Recording daily instant thoughts and casual rants",
            appreciation: "Collections of favorite illustrations, articles, and occasional personal creations",
        },
        rotatingSubTitle: {
            home: [
                "It will get better by tomorrow.",
                "If one longs for eternal love, is fleeing the best choice?",
                "Record, organize, and start again",
            ],
        },
        credit: {
            home: "— From Restart's daily notes",
        },
        rotatingPair: {
            home: [
                {
                    subTitle: "It will get better by tomorrow.",
                    credit: "—— アメリカ民谣研究会《明日には良くなるからね》",
                },
                {
                    subTitle: "If one longs for eternal love, is fleeing the best choice?",
                    credit: "—— ネジマキ《くじら雲（鲸鱼云）》",
                },
                {
                    subTitle: "Record, organize, and start again",
                    credit: "— After each archive refresh",
                },
            ],
        },
    },
    toc: "Contents",
    category: "Category",
    pageNavigation: {
        previous: "Prev",
        next: "Next",
        currentPage: "Page {currentPage} of {totalPages}",
    },
    button: {
        switchDarkMode: "Switch Dark Mode",
        backToTop: "Back to Top",
        backToBottom: "Back to Bottom",
        meun: "Menu",
        toc: "Contents",
        backToComments: "Back to Comments",
        cursorToggle: "Toggle Custom Cursor",
    },
    search: {
        placeholder: "Enter keywords to start searching",
        noresult: "No results found.",
        error: "Search error occurred. Please try again later."
    },
    license: {
        author: "Author",
        license: "License",
        publishon: "Published on"
    },
    blogNavi: {
        next: "Next Blog",
        prev: "Previous Blog"
    },
    pagecard: {
        words: "words",
        minutes: "min read",
        uncategorized: "Uncategorized"
    },
    comments: {
        name: "Name",
        email: "Email",
        site: "Website",
        required: "Required",
        optional: "Optional",
        welcome: "Welcome to comment",
        comments: "Comments",
        cancel: "Cancel",
        send: "Send",
        sending: "Sending...",
        reply: "Reply",
        replyPlaceholder: "Write your reply...",
        loadMore: "Load more",
        loading: "Loading comments...",
        loadFailed: "Failed to load",
        submitSuccess: "Submitted successfully",
        submitFailed: "Submission failed, please try again later",
        fillRequired: "Please fill in name, email and comment content",
        confirmDelete: "Are you sure you want to delete this comment?",
        delete: "Delete",
        deleteSuccess: "Successfully deleted",
        deleteFailed: "Failed to delete",
        deleteError: "Failed to delete comment",
        characters: "characters",
        words: "words",
        contentTooLong: "Comment content exceeds limit: no more than 2000 characters or 1000 words",
        replyTo: "reply to",
        like: "Like",
        unlike: "Unlike",
        likeFailed: "Action failed, please try again later",
        write: "Write",
        preview: "Preview",
        sortByTime: "By Time",
        sortByLikes: "By Likes",
        showMoreReplies: "Show more replies",
        collapseReplies: "Collapse"
    },
    emoji: {
        close: "Close",
        default: "Classic",
        bilibili: "Bilibili",
        kaomoji: "Kaomoji",
        emoji: "Emoji"
    },
    qa: {
        title: "Q&A",
        askQuestion: "Ask a Question",
        questionPlaceholder: "Write your question...",
        name: "Name",
        email: "Email",
        submit: "Submit",
        submitting: "Submitting...",
        submitSuccess: "Question submitted, will show after review",
        submitFailed: "Submission failed, please try again later",
        fillRequired: "Please fill in name, email and your question",
        loadFailed: "Failed to load",
        loading: "Loading Q&A...",
        empty: "No questions yet",
        total: "Questions",
        pending: "Pending"
    },
    langNote: {
        note: "Note: ",
        description: "This page does not support English, using the default language version"
    },
    draftNote: {
        warning: "Draft Warning: ",
        description: "This article is a draft and only appears in the testing environment. It will not be displayed in the production environment."
    },
    page404: {
        title: "404 - Void Realm",
        subTitle: "It looks like you've stumbled into a code wasteland that hasn't been developed yet.",
        backToHome: "Home",
        backToPreview: "Previous Page",
        errorCode: "Error Code: 404 - Void Realm",
        notice: "Perhaps you can try:"
    },
    themeInfo: {
        light: "Switch to Light Mode",
        dark: "Switch to Dark Mode",
        system: "Switch to System Mode"
    },
    memoCard: {
        words: "words",
        minutes: "min read",
        expanded: "Read more",
        collapsed: "Collapse"
    }
}

export default translation;