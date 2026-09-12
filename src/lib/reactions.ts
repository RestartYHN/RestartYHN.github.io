export interface ReactionType {
  key: string;
  label: string;
}

/**
 * Reaction emojis shared by comments and memos.
 * Keep the keys in sync with the backend allowlist
 * (worker `VALID_REACTIONS` / nodejs).
 */
export const REACTION_TYPES: ReactionType[] = [
  { key: '❤️', label: '爱' },
  { key: '😂', label: '笑' },
  { key: '😅', label: '汗' },
  { key: '👀', label: '盯' },
  { key: '🎉', label: '贺' },
  { key: '😮', label: '哇' },
  { key: '😆', label: '乐' },
  { key: '😉', label: '眨' },
  { key: '😭', label: '哭' },
  { key: '🍀', label: '运' },
];
