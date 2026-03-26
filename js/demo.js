// js/demo.js
import { els, state } from "./dom.js";
import { closeAllModals } from "./modal.js";
import { preloadImages } from "./utils.js";
import { lockInput } from "./utils.js";

const DEMO_SLIDE_DURATION = 6000;
let activeImage = "A";


export async function loadDemoSlides() {
  const response = await fetch("./demo-slides.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load demo slides: ${response.status}`);
  const data = await response.json();
  return data.slides || [];
}

export function preloadDemoSlides(slides) {
  preloadImages(slides, "image");
}

export function renderDemoSlide(index) {
  if (!state.demoSlides.length) return;

  const slide = state.demoSlides[index];

  els.demoImageA.src = slide.image;
  els.demoImageA.classList.add("is-active");
  els.demoImageB.classList.remove("is-active");

  activeImage = "A";

  if (els.demoTitle) {
    els.demoTitle.textContent =
      slide.title || "H2Flow Wastewater Treatment Solutions";
  }
}

export function transitionToDemoSlide(nextIndex) {
  if (!state.demoSlides.length) return;

  const nextSlide = state.demoSlides[nextIndex];

  const nextImgEl = activeImage === "A" ? els.demoImageB : els.demoImageA;
  const currentImgEl = activeImage === "A" ? els.demoImageA : els.demoImageB;

  const preloadImg = new Image();

  preloadImg.onload = () => {
    // Set next image BEFORE showing it
    nextImgEl.src = nextSlide.image;

    setTimeout(() => {
    if (els.demoTitle) {
      els.demoTitle.textContent =
        nextSlide.title || "H2Flow Wastewater Treatment Solutions";
    }
    }, 150);

    // Crossfade
    nextImgEl.classList.add("is-active");
    currentImgEl.classList.remove("is-active");

    // Update state
    state.currentDemoSlide = nextIndex;
    activeImage = activeImage === "A" ? "B" : "A";
  };

  preloadImg.src = nextSlide.image;
}

export function startDemoSlideshow() {
  if (!state.demoSlides.length) return;

  clearInterval(state.demoSlideTimer);
  state.currentDemoSlide = 0;
  renderDemoSlide(state.currentDemoSlide);

  state.demoSlideTimer = setInterval(() => {
    const nextIndex = (state.currentDemoSlide + 1) % state.demoSlides.length;
    transitionToDemoSlide(nextIndex);
  }, DEMO_SLIDE_DURATION);
}

export function stopDemoSlideshow() {
  clearInterval(state.demoSlideTimer);
}

export function showDemoScreen() {
  state.demoMode = true;
  closeAllModals();

  els.appShell.classList.add("is-hidden");
  els.demoScreen.classList.remove("is-hidden");

  startDemoSlideshow();

  if (els.demoButton) {
    els.demoButton.textContent = "Demo";
  }
}

export function hideDemoScreen() {
  state.demoMode = false;

  els.demoScreen.classList.add("is-hidden");
  els.appShell.classList.remove("is-hidden");

  stopDemoSlideshow();

  if (els.demoButton) {
    els.demoButton.textContent = "Demo";
  }
}

export function handleUserWake(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (state.demoMode) {
    hideDemoScreen();
    lockInput(450);
  }
}