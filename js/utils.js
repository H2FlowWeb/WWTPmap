// js/utils.js
import { state } from "./dom.js";

let inputLockedUntil = 0;

export function lockInput(ms = 400){
  inputLockedUntil = Date.now() + ms;
}

export function isInputLocked() {
  return Date.now() < inputLockedUntil;
}

export function safeClick(handler) {
  return function (...args) {
    if (isInputLocked()) return;

    const now = Date.now();
    if (now - state.lastTap < 250) return;

    state.lastTap = now;
    handler.apply(this, args);
  };
}
export function preloadImages(items, key = "image") {
  items.forEach((item) => {
    if (!item[key]) return;
    const img = new Image();
    img.src = item[key];
  });
}

export function extractYouTubeId(input) {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?/]+)/i,
    /(?:youtube\.com\/embed\/)([^&?/]+)/i,
    /(?:youtu\.be\/)([^&?/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return input;
}