import { writable } from 'svelte/store';

type PickerState = {
  open: boolean;
  callback: ((emoji: string, target?: HTMLElement | null) => void) | null;
  target?: HTMLElement | null;
};

const state = writable<PickerState>({ open: false, callback: null, target: null });

export function openPicker(cb: (emoji: string, target?: HTMLElement | null) => void, target?: HTMLElement | null) {
  state.set({ open: true, callback: cb, target: target ?? null });
}

export function closePicker() {
  state.set({ open: false, callback: null, target: null });
}

export default state;
