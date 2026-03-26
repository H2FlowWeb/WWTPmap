// js/main.js
import { els, state } from "./dom.js";
import { preloadImages } from "./utils.js";
import { closeAllModals } from "./modal.js";
import { closeVideoModal } from "./video.js";
import { loadDemoSlides, preloadDemoSlides, showDemoScreen, handleUserWake } from "./demo.js";
import { loadData, buildGrid, closeEquipmentModal } from "./map.js";

function handleOverlayClick() {
  closeAllModals();
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      if (els.fullscreenButton) {
        els.fullscreenButton.textContent = "Exit Fullscreen";
      }
    } else {
      await document.exitFullscreen();
      if (els.fullscreenButton) {
        els.fullscreenButton.textContent = "Fullscreen";
      }
    }
  } catch (error) {
    console.error("Fullscreen failed:", error);
  }
}

function syncFullscreenLabel() {
  if (!els.fullscreenButton) return;
  els.fullscreenButton.textContent = document.fullscreenElement
    ? "Exit Fullscreen"
    : "Fullscreen";
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllModals();
});

if (els.demoScreen) {
  els.demoScreen.addEventListener("click", handleUserWake);
  els.demoScreen.addEventListener("touchstart", handleUserWake, { passive: false });
}

if (els.overlay) {
  els.overlay.addEventListener("click", handleOverlayClick);
}

if (els.equipmentCloseButton) {
  els.equipmentCloseButton.addEventListener("click", closeEquipmentModal);
}

if (els.videoCloseButton) {
  els.videoCloseButton.addEventListener("click", closeVideoModal);
}

if (els.fullscreenButton) {
  els.fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", syncFullscreenLabel);
}

if (els.demoButton) {
  els.demoButton.addEventListener("click", () => {
    showDemoScreen();
  });
}

(async function init() {
  try {
    state.data = await loadData();
    state.demoSlides = await loadDemoSlides();

    preloadImages(state.data.areas);
    preloadDemoSlides(state.demoSlides);

    buildGrid(state.data);

    els.status.classList.add("is-hidden");
    els.grid.hidden = false;

    showDemoScreen();
  } catch (error) {
    console.error(error);
    els.status.innerHTML =
      "<p>Unable to load the equipment map. Confirm that the JSON files and assets are being served from a local web server or static host.</p>";
  }
})();