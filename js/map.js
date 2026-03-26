// js/map.js
import { els, state } from "./dom.js";
import { safeClick } from "./utils.js";
import { openModal, closeModal } from "./modal.js";
import { openVideo } from "./video.js";

export async function loadData() {
  const areasRes = await fetch("./data/areas.json", { cache: "no-store" });
  if (!areasRes.ok) throw new Error(`Failed to load areas.json: ${areasRes.status}`);

  const areasData = await areasRes.json();

  const equipmentEntries = await Promise.all(
    areasData.areas.map(async (area) => {
      const areaKey = area.key || area.id;
      const res = await fetch(`./data/${areaKey}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${areaKey}.json: ${res.status}`);

      const equipmentData = await res.json();
      return [areaKey, equipmentData.equipment || []];
    })
  );

  return {
    areas: areasData.areas,
    equipment: Object.fromEntries(equipmentEntries),
  };
}

export function normalizeVendor(item) {
  if (!item.vendor) return { name: "Other", logo: "" };
  if (typeof item.vendor === "string") return { name: item.vendor, logo: "" };
  return {
    name: item.vendor?.name || "Other",
    logo: item.vendor?.logo || "",
  };
}

export function groupItemsByVendor(items) {
  const groups = new Map();

  items.forEach((item) => {
    const vendor = normalizeVendor(item);
    const key = vendor.name.toLowerCase();

    if (!groups.has(key)) {
      groups.set(key, {
        vendorName: vendor.name,
        vendorLogo: vendor.logo,
        items: [],
      });
    }

    groups.get(key).items.push(item);
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: "base" })
  );
}

export function renderEquipmentButton(item, areaKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "equipment-item";
  button.innerHTML = `
    <div class="equipment-text">
      <div class="equipment-title">${item.title || item.name || ""}</div>
    </div>
  `;
  button.addEventListener("click", safeClick(() => openVideo(item, areaKey)));
  return button;
}

export function openEquipment(areaKey, label) {
  state.currentArea = areaKey;
  els.equipmentModalTitle.textContent = `${label} Equipment`;
  els.equipmentList.innerHTML = "";

  const items = state.data.equipment[areaKey] || [];
  const groups = groupItemsByVendor(items);

  groups.forEach((group, index) => {
    const groupWrap = document.createElement("section");
    groupWrap.className = "equipment-group";
    groupWrap.style.animationDelay = `${index * 40}ms`;

    const header = document.createElement("div");
    header.className = "equipment-group-header";
    header.innerHTML = `
      ${group.vendorLogo ? `<img class="equipment-group-logo" src="${group.vendorLogo}" alt="${group.vendorName} logo" onerror="this.style.display='none'">` : ""}
      <div class="equipment-group-name">${group.vendorName}</div>
    `;
    groupWrap.appendChild(header);

    group.items
      .sort((a, b) =>
        (a.title || a.name || "").localeCompare((b.title || b.name || ""), undefined, {
          sensitivity: "base",
        })
      )
      .forEach((item) => {
        groupWrap.appendChild(renderEquipmentButton(item, areaKey));
      });

    els.equipmentList.appendChild(groupWrap);
  });

  openModal(els.equipmentModal);
}

export function buildGrid(data) {
  els.grid.innerHTML = "";

  data.areas.forEach((area) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-card";
    button.setAttribute("data-area", area.key);
    button.setAttribute("aria-label", area.label);

    const image = document.createElement("img");
    image.src = area.image;
    image.alt = area.label;
    image.loading = "eager";
    image.onerror = () => {
      image.alt = `${area.label} image not found`;
      image.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#22354b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#dce8f5" font-family="Arial" font-size="28">${area.label}</text></svg>`
        );
    };

    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = area.label;

    button.appendChild(image);
    button.appendChild(label);
    button.addEventListener("click", safeClick(() => openEquipment(area.key, area.label)));
    els.grid.appendChild(button);
  });
}

export function closeEquipmentModal() {
  closeModal(els.equipmentModal);
}