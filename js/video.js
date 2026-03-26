// js/video.js
import { els, state } from "./dom.js";
import { extractYouTubeId } from "./utils.js";
import { openModal, closeModal } from "./modal.js";

export function resetVideo() {
  els.videoFrame.src = "";
  els.html5Video.pause();
  els.html5Video.removeAttribute("src");
  els.html5Video.load();
  els.html5Video.classList.add("is-hidden");
  els.videoFrame.classList.remove("is-hidden");
}

export function getVideoConfig(video) {
  if (!video) return { kind: "none", src: "" };

  if (typeof video === "string") {
    const id = extractYouTubeId(video);
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&cc_load_policy=1&cc_lang_pref=en&rel=0&modestbranding=1&fs=0`,
    };
  }

  switch (video.type) {
    case "youtube": {
      const id = extractYouTubeId(video.id || video.url || "");
      return {
        kind: "iframe",
        src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&cc_load_policy=1&cc_lang_pref=en&rel=0&modestbranding=1&fs=0`,
      };
    }
    case "vimeo":
      return {
        kind: "iframe",
        src: `https://player.vimeo.com/video/${video.id}?autoplay=1&muted=1`,
      };
    case "mp4":
      return {
        kind: "video",
        src: video.src || "",
        poster: video.poster || "",
      };
      case "wistia":
        return {
          kind: "iframe",
          src: `https://fast.wistia.net/embed/iframe/${video.id}?autoPlay=true&silentAutoPlay=true`,
        };
    default:
      return { kind: "none", src: "" };
  }
}

export function openVideo(item, areaKey) {
  state.currentArea = areaKey;
  els.videoModalTitle.textContent = item.title || item.name || "Video";

  const config = getVideoConfig(item.video);
  resetVideo();

  if (config.kind === "video") {
    els.videoFrame.classList.add("is-hidden");
    els.html5Video.classList.remove("is-hidden");
    if (config.poster) els.html5Video.poster = config.poster;
    els.html5Video.src = config.src;
    els.html5Video.play().catch(() => {});
  } else if (config.kind === "iframe") {
    els.videoFrame.classList.remove("is-hidden");
    els.html5Video.classList.add("is-hidden");
    els.videoFrame.src = config.src;
  }

  closeModal(els.equipmentModal, { keepOverlay: true, keepBodyLock: true });
  openModal(els.videoModal);
}

export function closeVideoModal() {
  resetVideo();
  closeModal(els.videoModal);
}