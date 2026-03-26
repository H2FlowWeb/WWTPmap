// js/modal.js
import { els } from "./dom.js";
import { resetVideo } from "./video.js";


export function openModal(modalEl) {
  els.overlay.classList.remove("is-hidden");
  modalEl.classList.remove("is-hidden");
  document.body.classList.add("no-scroll");
}

export function closeModal(modalEl, options = {}) {
  modalEl.classList.add("is-hidden");
  if (!options.keepOverlay) els.overlay.classList.add("is-hidden");
  if (!options.keepBodyLock) document.body.classList.remove("no-scroll");
}

export function closeAllModals() {
  resetVideo();
  els.equipmentModal.classList.add("is-hidden");
  els.videoModal.classList.add("is-hidden");
  els.overlay.classList.add("is-hidden");
  document.body.classList.remove("no-scroll");
}