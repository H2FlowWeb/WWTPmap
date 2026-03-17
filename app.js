const state = { data: null, currentArea: null, lastTap: 0 };
const statusEl = document.getElementById("statusCard"),
  gridEl = document.getElementById("tileGrid"),
  overlayEl = document.getElementById("overlay"),
  equipmentModalEl = document.getElementById("equipmentModal"),
  equipmentListEl = document.getElementById("equipmentList"),
  equipmentModalTitleEl = document.getElementById("equipmentModalTitle"),
  videoModalEl = document.getElementById("videoModal"),
  videoModalTitleEl = document.getElementById("videoModalTitle"),
  videoFrameEl = document.getElementById("videoFrame"),
  html5VideoEl = document.getElementById("html5Video"),
  equipmentCloseButtonEl = document.getElementById("equipmentCloseButton"),
  videoCloseButtonEl = document.getElementById("videoCloseButton"),
  fullscreenButtonEl = document.getElementById("fullscreenButton");
function safeClick(h) {
  return function (...a) {
    const n = Date.now();
    if (n - state.lastTap < 250) return;
    state.lastTap = n;
    h.apply(this, a);
  };
}
function preloadImages(a) {
  a.forEach((r) => {
    const i = new Image();
    i.src = r.image;
  });
}
async function loadData() {
  const r = await fetch("equipment-data.json", { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to load data: ${r.status}`);
  return r.json();
}
function buildGrid(d) {
  gridEl.innerHTML = "";
  d.areas.forEach((area) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile-card";
    b.setAttribute("data-area", area.key);
    b.setAttribute("aria-label", area.label);
    const image = document.createElement("img");
    image.src = area.image;
    image.alt = area.label;
    image.loading = "eager";
    image.onerror = () => {
      image.alt = `${area.label} image not found`;
      image.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#22354b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#dce8f5" font-family="Arial" font-size="28">${area.label}</text></svg>`,
        );
    };
    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = area.label;
    b.appendChild(image);
    b.appendChild(label);
    b.addEventListener(
      "click",
      safeClick(() => openEquipment(area.key, area.label)),
    );
    gridEl.appendChild(b);
  });
}
function openModal(m) {
  overlayEl.classList.remove("is-hidden");
  m.classList.remove("is-hidden");
  document.body.classList.add("no-scroll");
}
function closeModal(m, o = {}) {
  m.classList.add("is-hidden");
  if (!o.keepOverlay) overlayEl.classList.add("is-hidden");
  if (!o.keepBodyLock) document.body.classList.remove("no-scroll");
}
function resetVideo() {
  videoFrameEl.src = "";
  html5VideoEl.pause();
  html5VideoEl.removeAttribute("src");
  html5VideoEl.load();
  html5VideoEl.classList.add("is-hidden");
  videoFrameEl.classList.remove("is-hidden");
}
function extractYouTubeId(input) {
  if (!input) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?/]+)/i,
    /(?:youtube\.com\/embed\/)([^&?/]+)/i,
    /(?:youtu\.be\/)([^&?/]+)/i,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return input;
}
function getVideoConfig(video) {
  if (!video) return { kind: "none", src: "" };
  if (typeof video === "string") {
    const id = extractYouTubeId(video);
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&cc_load_policy=1&rel=0`,
    };
  }
  switch (video.type) {
    case "youtube": {
      const id = extractYouTubeId(video.id || video.url || "");
      return {
        kind: "iframe",
        src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&cc_load_policy=1&rel=0`,
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
    default:
      return { kind: "none", src: "" };
  }
}
function normalizeVendor(item) {
  if (!item.vendor) return { name: "Other", logo: "" };
  if (typeof item.vendor === "string") return { name: item.vendor, logo: "" };
  return { name: item.vendor?.name || "Other", logo: item.vendor?.logo || "" };
}
function groupItemsByVendor(items) {
  const groups = new Map();
  items.forEach((item) => {
    const vendor = normalizeVendor(item),
      key = vendor.name.toLowerCase();
    if (!groups.has(key))
      groups.set(key, {
        vendorName: vendor.name,
        vendorLogo: vendor.logo,
        items: [],
      });
    groups.get(key).items.push(item);
  });
  return Array.from(groups.values()).sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName, void 0, { sensitivity: "base" }),
  );
}
function renderEquipmentButton(item, areaKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "equipment-item";
  button.innerHTML = `<div class="equipment-text"><div class="equipment-title">${item.title || item.name || ""}</div></div>`;
  button.addEventListener(
    "click",
    safeClick(() => openVideo(item, areaKey)),
  );
  return button;
}
function openEquipment(areaKey, label) {
  state.currentArea = areaKey;
  equipmentModalTitleEl.textContent = `${label} Equipment`;
  equipmentListEl.innerHTML = "";
  const items = state.data.equipment[areaKey] || [],
    groups = groupItemsByVendor(items);
  groups.forEach((group, index) => {
    const groupWrap = document.createElement("section");
    groupWrap.className = "equipment-group";
    groupWrap.style.animationDelay = `${index * 40}ms`;
    const header = document.createElement("div");
    header.className = "equipment-group-header";
    header.innerHTML = `${group.vendorLogo ? `<img class="equipment-group-logo" src="${group.vendorLogo}" alt="${group.vendorName} logo" onerror="this.style.display='none'">` : ""}<div class="equipment-group-name">${group.vendorName}</div>`;
    groupWrap.appendChild(header);
    group.items
      .sort((a, b) =>
        (a.title || a.name || "").localeCompare(
          b.title || b.name || "",
          void 0,
          { sensitivity: "base" },
        ),
      )
      .forEach((item) =>
        groupWrap.appendChild(renderEquipmentButton(item, areaKey)),
      );
    equipmentListEl.appendChild(groupWrap);
  });
  openModal(equipmentModalEl);
}
function openVideo(item, area) {
  state.currentArea = area;
  videoModalTitleEl.textContent = item.title || item.name || "Video";
  const config = getVideoConfig(item.video);
  resetVideo();
  if (config.kind === "video") {
    videoFrameEl.classList.add("is-hidden");
    html5VideoEl.classList.remove("is-hidden");
    if (config.poster) html5VideoEl.poster = config.poster;
    html5VideoEl.src = config.src;
    html5VideoEl.play().catch(() => {});
  } else if (config.kind === "iframe") {
    videoFrameEl.classList.remove("is-hidden");
    html5VideoEl.classList.add("is-hidden");
    videoFrameEl.src = config.src;
  }
  closeModal(equipmentModalEl, { keepOverlay: !0, keepBodyLock: !0 });
  openModal(videoModalEl);
}
function closeEquipmentModal() {
  closeModal(equipmentModalEl);
}
function closeVideoModal() {
  resetVideo();
  closeModal(videoModalEl);
}
function closeAllModals() {
  resetVideo();
  equipmentModalEl.classList.add("is-hidden");
  videoModalEl.classList.add("is-hidden");
  overlayEl.classList.add("is-hidden");
  document.body.classList.remove("no-scroll");
}
function handleOverlayClick() {
  closeAllModals();
}
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      fullscreenButtonEl.textContent = "Exit Fullscreen";
    } else {
      await document.exitFullscreen();
      fullscreenButtonEl.textContent = "Fullscreen";
    }
  } catch (error) {
    console.error("Fullscreen failed:", error);
  }
}
function syncFullscreenLabel() {
  fullscreenButtonEl.textContent = document.fullscreenElement
    ? "Exit Fullscreen"
    : "Fullscreen";
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllModals();
});
overlayEl.addEventListener("click", handleOverlayClick);
equipmentCloseButtonEl.addEventListener("click", closeEquipmentModal);
videoCloseButtonEl.addEventListener("click", closeVideoModal);
fullscreenButtonEl.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", syncFullscreenLabel);
(async function init() {
  try {
    state.data = await loadData();
    preloadImages(state.data.areas);
    buildGrid(state.data);
    statusEl.classList.add("is-hidden");
    gridEl.hidden = !1;
  } catch (error) {
    console.error(error);
    statusEl.innerHTML =
      "<p>Unable to load the equipment map. Confirm that the JSON file and assets are being served from a local web server or static host.</p>";
  }
})();
