import { writable } from 'svelte/store';

export const previewImageStore = writable<string | null>(null);
