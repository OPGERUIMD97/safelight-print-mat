// Safelight Print Mat Extension v1.0.0
// Complete photo framing toolkit:
// Canvas system, photo scale, mat + bevel, frame + ratio, rounded/circle corners,
// directional shadows (frame + internal), textures, EXIF captions, defaults.

const STORAGE_KEY  = "safelight-print-mat-templates";
const DEFAULTS_KEY = "safelight-print-mat-user-defaults";
const ACTIVE_KEY   = "safelight-print-mat-active-template";

const FONTS = [
  { id: "monospace",      label: "Monospace (typewriter)" },
  { id: "sans-serif",     label: "Sans-serif" },
  { id: "serif",          label: "Serif" },
  { id: "Georgia",        label: "Georgia" },
  { id: "Courier New",    label: "Courier New" },
  { id: "Helvetica Neue", label: "Helvetica Neue" },
];

const ANCHORS = ["bottom-left", "bottom-right", "bottom-center", "top-left", "top-right", "top-center"];

const TEXTURES = [
  { id: "solid",    label: "Solid color" },
  { id: "linen",    label: "Linen" },
  { id: "felt",     label: "Felt" },
  { id: "wood",     label: "Wood grain" },
  { id: "terrazzo", label: "Terrazzo" },
  { id: "grass",    label: "Grass" },
  { id: "paper",    label: "Textured paper" },
];

const TEXTURE_PRESETS = [
  { name: "Blue Grass",         texture: "grass",    color: "#1d5fa8" },
  { name: "Green Lawn",         texture: "grass",    color: "#2e7d32" },
  { name: "Linen",              texture: "linen",    color: "#cfc4a8" },
  { name: "Wood Grain",         texture: "wood",     color: "#c99a3e" },
  { name: "Red Felt",           texture: "felt",     color: "#a3192b" },
  { name: "Turquoise Terrazzo", texture: "terrazzo", color: "#3fa896" },
];

const FRAME_STYLES = [
  { id: "none",  label: "No frame (mat only)" },
  { id: "black", label: "Black frame" },
  { id: "brown", label: "Brown frame" },
  { id: "white", label: "White frame" },
  { id: "gold",  label: "Gold frame" },
];

const CORNER_STYLES = [
  { id: "sharp",              label: "Sharp corners" },
  { id: "rounded",             label: "Rounded (mat + frame)" },
  { id: "rounded-photo-only",  label: "Rounded (photo only)" },
  { id: "circle",              label: "Circle (requires 1:1 crop)" },
];

const CANVAS_RATIOS = [
  { id: "auto",   label: "Match photo (no canvas)" },
  { id: "1:1",    label: "Square (1:1)" },
  { id: "4:5",    label: "Portrait (4:5)" },
  { id: "5:4",    label: "Landscape (5:4)" },
  { id: "9:16",   label: "Story (9:16)" },
  { id: "16:9",   label: "Widescreen (16:9)" },
  { id: "2:3",    label: "Print (2:3)" },
  { id: "3:2",    label: "Print (3:2)" },
];

const CROP_RATIOS = [
  { id: "auto", label: "Original (no crop)" },
  { id: "1:1",  label: "Square (1:1)" },
  { id: "4:5",  label: "Portrait (4:5)" },
  { id: "5:4",  label: "Landscape (5:4)" },
  { id: "2:3",  label: "Print (2:3)" },
  { id: "3:2",  label: "Print (3:2)" },
  { id: "16:9", label: "Widescreen (16:9)" },
];

const DEFAULT_TEXT_FIELD = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  enabled: true,
  source: "custom",
  customText: "",
  anchor: "bottom-right",
  fontFamily: "monospace",
  fontSize: 1.6,
  color: "#4a4a4a",
  letterSpacing: 1.5,
  dateLocale: "system",   // only relevant when source === "datetime"
  dateLocaleCustom: "",   // custom BCP-47 locale code, used when dateLocale === "custom"
  showDate: true,         // only relevant when source === "datetime"
  showTime: true,         // only relevant when source === "datetime"
  showAperture: true,     // only relevant when source === "settings"
  showShutter: true,      // only relevant when source === "settings"
  showIso: true,          // only relevant when source === "settings"
});

// ── Locale options for the Date & time (EXIF) field ─────────────────────────
const DATE_LOCALES = [
  { id: "system", label: "System language (automatic)" },
  { id: "nl-NL",  label: "Nederlands" },
  { id: "en-GB",  label: "English (UK)" },
  { id: "en-US",  label: "English (US)" },
  { id: "de-DE",  label: "Deutsch" },
  { id: "fr-FR",  label: "Français" },
  { id: "es-ES",  label: "Español" },
  { id: "custom", label: "Custom (locale code)…" },
];

// Resolve the user's OS/browser language, with a safe fallback.
function resolveSystemLocale() {
  try {
    if (typeof navigator !== "undefined") {
      if (Array.isArray(navigator.languages) && navigator.languages.length) return navigator.languages[0];
      if (navigator.language) return navigator.language;
    }
  } catch (e) {}
  return "en-GB";
}

// Resolve which locale string to actually use for a given text field.
function resolveFieldLocale(field) {
  const choice = field?.dateLocale || "system";
  if (choice === "system") return resolveSystemLocale();
  if (choice === "custom") return (field.dateLocaleCustom || "").trim() || resolveSystemLocale();
  return choice;
}

function freshTemplate() {
  return {
    id: "default",
    name: "Classic Mat",
    enabled: true,

    // Canvas (the "stage" the framed photo sits on — independent of photo size)
    canvasRatio: "auto",
    canvasColor: "#e8e4dc",
    canvasTexture: "solid",

    // Photo crop (applied before framing)
    cropRatio: "auto",
    cropOffset: 0.5,    // 0-1, position within the crop when ratio doesn't match

    // Photo scale (how much of the canvas the framed photo occupies)
    photoScale: 100,    // 5-100 %, only relevant when canvasRatio !== "auto"

    // Mat
    matColor: "#ffffff",
    matTexture: "solid",
    matWidthTop:    4,
    matWidthRight:  4,
    matWidthBottom: 8,
    matWidthLeft:   4,
    linked: false,

    // Matte bevel (3D edge around the photo, inside the mat)
    matteBevel: false,
    matteBevelSize: 0.8,     // % of long edge
    matteBevelStrength: 50,  // 0-100

    // Frame (outer border around the mat)
    frameStyle: "none",
    frameWidth: 1.5,
    frameRatio: "auto",      // independent aspect ratio for the frame itself

    // Corners
    cornerStyle: "sharp",
    cornerRadius: 2,

    // Frame shadow (outer, with direction)
    frameShadow: false,
    frameShadowBlur: 2,
    frameShadowOpacity: 25,
    frameShadowAngle: 135,    // degrees, 0=right, 90=down, 180=left, 270=up
    frameShadowDistance: 1.5, // % of long edge

    // Internal shadow (inside the frame, over photo+mat — with direction)
    internalShadow: true,
    internalShadowBlur: 1.2,
    internalShadowOpacity: 35,
    internalShadowAngle: 135,
    internalShadowDistance: 0.3,

    matchLighting: false, // sync internal shadow direction/softness to frame shadow

    textFields: [
      { ...DEFAULT_TEXT_FIELD(), id: "cam", source: "camera",   anchor: "bottom-left"  },
      { ...DEFAULT_TEXT_FIELD(), id: "dt",  source: "datetime", anchor: "bottom-right" },
    ],
  };
}

const PRESETS = [
  { name: "Classic Mat",           over: {} },
  { name: "Black Frame + Mat",     over: { frameStyle: "black", frameWidth: 1.2, matWidthBottom: 4 } },
  { name: "Brown Frame + Mat",     over: { frameStyle: "brown", frameWidth: 1.5, matWidthBottom: 4 } },
  { name: "Rounded Black Frame",   over: { frameStyle: "black", cornerStyle: "rounded", cornerRadius: 4, matWidthBottom: 4 } },
  { name: "White Passe-Partout",   over: { matColor: "#ffffff", matWidthBottom: 4, textFields: [] } },
  { name: "Rounded White Mat",     over: { matColor: "#ffffff", cornerStyle: "rounded", cornerRadius: 3, matWidthBottom: 4, textFields: [] } },
  { name: "Instant Film (Square)", over: { matColor: "#ffffff", matWidthTop: 4, matWidthRight: 4, matWidthLeft: 4, matWidthBottom: 18, cornerStyle: "rounded", cornerRadius: 2, textFields: [] } },
  { name: "Circle Frame",          over: { matColor: "#ffffff", cornerStyle: "circle", cropRatio: "1:1", matWidthBottom: 4, textFields: [] } },
  { name: "Floating on Canvas",    over: { canvasRatio: "1:1", canvasColor: "#e8e4dc", photoScale: 78, frameShadow: true, frameShadowOpacity: 30, matWidthBottom: 4, textFields: [] } },
];

function buildPreset(over) {
  return { ...freshTemplate(), ...over,
    textFields: (over.textFields !== undefined ? over.textFields : freshTemplate().textFields)
      .map(f => ({ ...f, id: f.id + "_" + Date.now() + Math.random().toString(36).slice(2,5) })) };
}

// ── Styles (Safelight theme CSS variables) ──────────────────────────────────
const S = {
  container: {
    background: "var(--color-surface-0)", color: "var(--color-text-primary)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 11, padding: "10px 12px",
    height: "100%", overflowY: "auto", boxSizing: "border-box",
  },
  sectionTitle: {
    color: "var(--color-accent)", fontSize: 10, fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    margin: "12px 0 6px",
  },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "var(--color-text-secondary)", fontSize: 11 },
  input: {
    background: "var(--color-surface-2)", color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 3, padding: "3px 6px", fontSize: 11, width: 60, textAlign: "right",
  },
  inputText: {
    background: "var(--color-surface-2)", color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 3, padding: "3px 6px", fontSize: 11, width: 140,
  },
  select: {
    background: "var(--color-surface-2)", color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 3, padding: "3px 6px", fontSize: 11, width: 150,
  },
  colorInput: {
    width: 36, height: 24, borderRadius: 3, border: "1px solid var(--color-border)",
    cursor: "pointer", padding: 0,
  },
  btn: {
    background: "var(--color-surface-2)", color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 3, padding: "4px 10px", fontSize: 11, cursor: "pointer",
  },
  btnAccent: {
    background: "var(--color-accent)", color: "var(--color-text-primary)", border: "none",
    borderRadius: 3, padding: "4px 10px", fontSize: 11, cursor: "pointer",
  },
  btnDanger: {
    background: "var(--color-surface-2)", color: "#E05252",
    border: "1px solid var(--color-border)",
    borderRadius: 3, padding: "4px 10px", fontSize: 11, cursor: "pointer",
  },
  divider: { borderColor: "var(--color-border-subtle)", margin: "10px 0" },
  checkbox: { accentColor: "var(--color-accent)", marginRight: 6 },
  tag: {
    display: "inline-block", padding: "2px 8px", borderRadius: 12,
    background: "var(--color-surface-2)", color: "var(--color-text-secondary)",
    fontSize: 10, marginRight: 4, marginBottom: 4, cursor: "pointer",
  },
  tagActive: {
    display: "inline-block", padding: "2px 8px", borderRadius: 12,
    background: "var(--color-accent)", color: "var(--color-text-primary)",
    fontSize: 10, marginRight: 4, marginBottom: 4, cursor: "pointer",
  },
  presetCard: {
    display: "inline-block", width: 64, marginRight: 8, marginBottom: 8,
    cursor: "pointer", textAlign: "center", verticalAlign: "top",
  },
  presetSwatch: {
    width: 64, height: 44, borderRadius: 4, border: "1px solid var(--color-border)",
    marginBottom: 3,
  },
  presetLabel: { fontSize: 9, color: "var(--color-text-secondary)", lineHeight: 1.2 },
  fieldCard: {
    background: "var(--color-surface-1)", border: "1px solid var(--color-border-subtle)",
    borderRadius: 4, padding: 8, marginBottom: 8,
  },
  fieldHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  preview: {
    background: "var(--color-surface-1)", borderRadius: 4, padding: 8, marginTop: 6,
    display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100,
  },
  previewBtn: {
    display: "block", width: "100%", padding: "8px 0",
    background: "var(--color-accent)", color: "var(--color-text-primary)",
    border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600,
    cursor: "pointer", marginTop: 10,
  },
  dial: {
    width: 70, height: 70, borderRadius: "50%",
    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
    position: "relative", cursor: "pointer", marginBottom: 6,
  },
  dialDot: {
    width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)",
    position: "absolute",
  },
  defaultsRow: { display: "flex", gap: 6, marginTop: 10 },
};

// ── Storage ───────────────────────────────────────────────────────────────────
function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [freshTemplate()];
}
function saveTemplates(t) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch (e) {}
}
function loadUserDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveUserDefaults(template) {
  try {
    const { id, name, ...rest } = template;
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify(rest));
  } catch (e) {}
}
function loadActiveTemplateId() {
  try { return localStorage.getItem(ACTIVE_KEY) || null; } catch (e) { return null; }
}
function saveActiveTemplateId(id) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
}
// Pick the template that should be used for export/printing: the one the
// user last had selected in the panel, falling back to the first template.
function resolveExportTemplate(templates) {
  const activeId = loadActiveTemplateId();
  return (activeId && templates.find(t => t.id === activeId)) || templates[0];
}

// ── EXIF text ─────────────────────────────────────────────────────────────────
// Different host versions / RAW decoders may expose EXIF under slightly
// different key names. Check the common variants defensively instead of
// assuming one exact shape.
function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Robustly format a shutter speed value. The host may supply it either as a
// plain number of seconds (e.g. 0.0015625 for 1/640s) or as an already
// human-formatted string (e.g. "1/640", "1/640s", "2s"). Treating a
// pre-formatted string as a number was producing "1/NaN".
function formatShutter(raw) {
  if (raw === undefined || raw === null || raw === "") return "";
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return "";
    if (/\//.test(s)) return s;            // already "1/640"-style — use as-is
    if (/s\s*$/i.test(s)) return s;        // already "2s"-style — use as-is
    const n = Number(s);
    if (isFinite(n) && n > 0) return n >= 1 ? `${n}s` : `1/${Math.round(1 / n)}`;
    return s; // unrecognized format — show raw rather than nothing
  }
  const n = Number(raw);
  if (!isFinite(n) || n <= 0) return "";
  return n >= 1 ? `${n}s` : `1/${Math.round(1 / n)}`;
}

function resolveFieldText(field, photo) {
  if (field.source === "custom") return field.customText || "";
  const e = photo?.exif || {};
  switch (field.source) {
    case "camera": {
      // Manufacturers often write a verbose "make" (e.g. "NIKON CORPORATION",
      // "CANON INC.", "SONY CORPORATION") and a model that may or may not
      // already repeat the brand name (Canon/Sony do, Nikon/Fujifilm don't).
      // Strip corporate suffixes generically, then avoid duplicating the
      // brand if the model already starts with it.
      const rawMake  = (pick(e, ["make", "cameraMake", "Make"]) || "").toString().trim();
      const rawModel = (pick(e, ["model", "cameraModel", "Model"]) || "").toString().trim();
      if (!rawMake && !rawModel) {
        if (typeof console !== "undefined") {
          console.log("[safelight-print-mat] Camera field: no make/model found in photo.exif —", e);
        }
        return "—";
      }
      const make = rawMake
        .replace(/\s*(corporation|corp\.?|company|co\.,?\s*ltd\.?|imaging|inc\.?)\s*$/i, "")
        .trim();
      if (!rawModel) return make.toUpperCase() || "—";
      if (make && rawModel.toUpperCase().startsWith(make.toUpperCase())) {
        return rawModel.toUpperCase();
      }
      return [make, rawModel].filter(Boolean).join(" ").toUpperCase().trim() || "—";
    }
    case "datetime": {
      const showDate = field.showDate !== false;
      const showTime = field.showTime !== false;
      if (!showDate && !showTime) return "";
      if (!photo?.dateCreated) return "—";
      const d = new Date(photo.dateCreated);
      const locale = resolveFieldLocale(field);
      let date = "", time = "";
      try {
        if (showDate) date = d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
        if (showTime) time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      } catch (err) {
        // Invalid/unsupported locale code (e.g. a typo in a custom code) — fall back safely.
        if (showDate) date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        if (showTime) time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      }
      return [date, time].filter(Boolean).join("   ");
    }
    case "lens": {
      const lens = pick(e, ["lensModel", "lens", "lensInfo", "Lens", "LensModel", "lensName", "lensSpec"]);
      if (!lens) {
        if (typeof console !== "undefined") {
          console.log("[safelight-print-mat] Lens field: no lens info found in photo.exif —", e);
        }
        return "—";
      }
      return lens.toString().trim() || "—";
    }
    case "settings": {
      const showAperture = field.showAperture !== false;
      const showShutter  = field.showShutter  !== false;
      const showIso      = field.showIso      !== false;
      if (!showAperture && !showShutter && !showIso) return "";

      const aperture = pick(e, ["aperture", "fNumber", "FNumber"]);
      const shutter  = pick(e, ["shutter", "shutterSpeed", "exposureTime", "ExposureTime"]);
      const iso      = pick(e, ["iso", "isoSpeed", "ISO"]);

      const ap   = (showAperture && aperture) ? `f/${aperture}` : "";
      const sh   = showShutter ? formatShutter(shutter) : "";
      const isoT = (showIso && iso) ? `ISO ${iso}` : "";
      return [ap, sh, isoT].filter(Boolean).join("  ·  ") || "—";
    }
    default:
      return "";
  }
}

// ── Texture generation ───────────────────────────────────────────────────────
function applyTexture(ctx, x, y, w, h, textureId, baseColor) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);
  if (textureId === "solid" || !textureId) return;

  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  switch (textureId) {
    case "linen": {
      ctx.globalAlpha = 0.08; ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      const spacing = Math.max(3, w * 0.012);
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i - h, y + h); ctx.stroke();
      }
      ctx.globalAlpha = 0.05; ctx.strokeStyle = "#fff";
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath(); ctx.moveTo(x + i + spacing/2, y); ctx.lineTo(x + i - h + spacing/2, y + h); ctx.stroke();
      }
      break;
    }
    case "felt": {
      const dotCount = Math.floor((w * h) / 40);
      for (let i = 0; i < dotCount; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        ctx.globalAlpha = Math.random() * 0.06;
        ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
        ctx.fillRect(px, py, 1.2, 1.2);
      }
      break;
    }
    case "wood": {
      ctx.globalAlpha = 0.12; ctx.strokeStyle = "#5a3a1a";
      const lines = Math.max(8, Math.floor(h / 6));
      for (let i = 0; i < lines; i++) {
        const ly = y + (h / lines) * i + (Math.random() - 0.5) * 3;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath(); ctx.moveTo(x, ly);
        for (let px = x; px < x + w; px += 20) ctx.lineTo(px, ly + Math.sin(px * 0.05 + i) * 2);
        ctx.stroke();
      }
      break;
    }
    case "terrazzo": {
      const chipCount = Math.floor((w * h) / 800);
      for (let i = 0; i < chipCount; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        const r = 2 + Math.random() * 4;
        const shades = ["#fff", "#000", baseColor];
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
        ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "grass": {
      const blades = Math.floor(w / 2);
      for (let i = 0; i < blades; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        const len = 2 + Math.random() * 3;
        ctx.globalAlpha = 0.1 + Math.random() * 0.15;
        ctx.strokeStyle = Math.random() > 0.5 ? "#000" : "#fff";
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (Math.random()-0.5)*2, py - len); ctx.stroke();
      }
      break;
    }
    case "paper": {
      const dotCount = Math.floor((w * h) / 25);
      for (let i = 0; i < dotCount; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        ctx.globalAlpha = Math.random() * 0.04;
        ctx.fillStyle = "#000";
        ctx.fillRect(px, py, 1, 1);
      }
      break;
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

const FRAME_COLORS = { black: "#1a1a1a", brown: "#5a3a1f", white: "#f5f5f0", gold: "#c9a227" };

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function parseRatio(id) {
  if (id === "auto" || !id) return null;
  const [a, b] = id.split(":").map(Number);
  return a / b;
}

// Convert angle (deg, 0=right/east, clockwise) + distance to offsetX/offsetY
function angleToOffset(angleDeg, distance) {
  const rad = (angleDeg * Math.PI) / 180;
  return { dx: Math.cos(rad) * distance, dy: Math.sin(rad) * distance };
}

// ── Crop helper: returns source rect to draw from bitmap for target ratio ────
function computeCropRect(bw, bh, ratioId, offset) {
  const ratio = parseRatio(ratioId);
  if (!ratio) return { sx: 0, sy: 0, sw: bw, sh: bh };
  const current = bw / bh;
  if (Math.abs(current - ratio) < 0.001) return { sx: 0, sy: 0, sw: bw, sh: bh };

  if (current > ratio) {
    // source wider than target -> crop width
    const targetW = bh * ratio;
    const maxX = bw - targetW;
    const sx = maxX * offset;
    return { sx, sy: 0, sw: targetW, sh: bh };
  } else {
    // source taller than target -> crop height
    const targetH = bw / ratio;
    const maxY = bh - targetH;
    const sy = maxY * offset;
    return { sx: 0, sy, sw: bw, sh: targetH };
  }
}

// ── Main render (export + preview share this) ────────────────────────────────
async function renderPrintMat(blob, template, photo) {
  console.log("[safelight-print-mat] renderPrintMat() called —", { templateEnabled: template.enabled, blobSize: blob.size, blobType: blob.type });
  if (!template.enabled) return blob;
  const srcBitmap = await createImageBitmap(blob);
  console.log("[safelight-print-mat] source decoded —", { width: srcBitmap.width, height: srcBitmap.height });
  if (!srcBitmap.width || !srcBitmap.height) {
    throw new Error(`[safelight-print-mat] Photo failed to decode (got ${srcBitmap.width}x${srcBitmap.height} from a ${blob.size}-byte ${blob.type} blob). Falling back to the unedited export.`);
  }

  // 1. Crop
  const crop = computeCropRect(srcBitmap.width, srcBitmap.height, template.cropRatio, template.cropOffset ?? 0.5);
  let photoW = Math.round(crop.sw), photoH = Math.round(crop.sh);

  const cropCanvas = new OffscreenCanvas(photoW, photoH);
  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
  cropCtx.drawImage(srcBitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, photoW, photoH);
  try {
    const px = cropCtx.getImageData(Math.round(photoW / 2), Math.round(photoH / 2), 1, 1).data;
    console.log("[safelight-print-mat] pixel sample at center (cropCanvas, right after crop):", Array.from(px));
  } catch (err) {
    console.error("[safelight-print-mat] could not sample pixel from cropCanvas:", err);
  }
  // Note: cropCanvas itself is a valid CanvasImageSource — drawing it directly
  // below avoids an extra createImageBitmap(canvas) round-trip. That extra
  // decode step has been observed to silently produce a black/blank result
  // on some Windows GPU/driver (ANGLE/D3D11) configurations, even though the
  // canvas it was decoding from was drawn correctly — while macOS (Metal)
  // doesn't show the issue. Skipping it removes that risk entirely and is
  // also one less decode to pay for.

  const long = Math.max(photoW, photoH);
  const short = Math.min(photoW, photoH);

  const isCircle = template.cornerStyle === "circle";

  const frameW = template.frameStyle !== "none" ? Math.round(long * (template.frameWidth / 100)) : 0;
  const matTop    = Math.round(long * (template.matWidthTop    / 100));
  const matRight  = Math.round(long * (template.matWidthRight  / 100));
  const matBottom = Math.round(long * (template.matWidthBottom / 100));
  const matLeft   = Math.round(long * (template.matWidthLeft   / 100));

  // Framed unit size (photo + mat + frame)
  let unitW = photoW + matLeft + matRight  + frameW * 2;
  let unitH = photoH + matTop  + matBottom + frameW * 2;

  // 2. Canvas (the "stage") — independent ratio/size
  const canvasRatio = parseRatio(template.canvasRatio);
  let W, H, unitX, unitY, unitScale = 1;

  if (canvasRatio) {
    // Canvas size derived from the unit's long edge, scaled so framed unit fits per photoScale
    const baseLong = Math.max(unitW, unitH);
    const targetUnitLong = baseLong; // 100% scale reference
    const scale = (template.photoScale || 100) / 100;

    if (canvasRatio >= 1) { W = targetUnitLong / scale; H = W / canvasRatio; }
    else { H = targetUnitLong / scale; W = H * canvasRatio; }

    // Ensure framed unit actually fits; if not, scale canvas up
    const fitScaleW = unitW / W, fitScaleH = unitH / H;
    const neededScale = Math.max(fitScaleW, fitScaleH) / scale;
    if (neededScale > 1) { W *= neededScale; H *= neededScale; }

    unitScale = 1;
    unitX = (W - unitW) / 2;
    unitY = (H - unitH) / 2;
  } else {
    W = unitW; H = unitH; unitX = 0; unitY = 0;
  }

  const frameShadowPad = template.frameShadow
    ? Math.round(long * (template.frameShadowBlur / 100)) * 3 + Math.round(long * (template.frameShadowDistance / 100)) * 2
    : 0;

  const canvas = new OffscreenCanvas(Math.round(W + frameShadowPad * 2), Math.round(H + frameShadowPad * 2));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const ox = frameShadowPad, oy = frameShadowPad;

  // 3. Canvas background
  applyTexture(ctx, ox, oy, W, H, template.canvasTexture, template.canvasColor || "#e8e4dc");

  // 4. Frame shadow (directional drop shadow under the framed unit)
  const cornerR = (template.cornerStyle === "rounded") ? Math.round(short * (template.cornerRadius / 100)) : 0;

  if (template.frameShadow) {
    const { dx, dy } = angleToOffset(template.frameShadowAngle, long * (template.frameShadowDistance / 100));
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${template.frameShadowOpacity / 100})`;
    ctx.shadowBlur = long * (template.frameShadowBlur / 100);
    ctx.shadowOffsetX = dx;
    ctx.shadowOffsetY = dy;
    ctx.fillStyle = "#000";
    const ux = ox + unitX, uy = oy + unitY;
    if (isCircle) {
      ctx.beginPath(); ctx.arc(ux + unitW/2, uy + unitH/2, Math.min(unitW,unitH)/2, 0, Math.PI*2); ctx.fill();
    } else if (cornerR > 0) {
      roundRectPath(ctx, ux, uy, unitW, unitH, cornerR); ctx.fill();
    } else {
      ctx.fillRect(ux, uy, unitW, unitH);
    }
    ctx.restore();
  }

  // 5. Frame + Mat (clipped to corner shape)
  const ux = ox + unitX, uy = oy + unitY;
  ctx.save();
  if (isCircle) {
    ctx.beginPath(); ctx.arc(ux + unitW/2, uy + unitH/2, Math.min(unitW,unitH)/2, 0, Math.PI*2); ctx.clip();
  } else if (cornerR > 0) {
    roundRectPath(ctx, ux, uy, unitW, unitH, cornerR); ctx.clip();
  } else {
    ctx.beginPath(); ctx.rect(ux, uy, unitW, unitH); ctx.clip();
  }

  if (frameW > 0) {
    ctx.fillStyle = FRAME_COLORS[template.frameStyle] || "#1a1a1a";
    ctx.fillRect(ux, uy, unitW, unitH);
    const grad = ctx.createLinearGradient(ux, uy, ux, uy + unitH);
    grad.addColorStop(0, "rgba(255,255,255,0.15)");
    grad.addColorStop(0.05, "rgba(255,255,255,0)");
    grad.addColorStop(0.95, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = grad;
    ctx.fillRect(ux, uy, unitW, unitH);
  }

  const matX = ux + frameW, matY = uy + frameW;
  const matW = unitW - frameW * 2, matH = unitH - frameW * 2;
  applyTexture(ctx, matX, matY, matW, matH, template.matTexture, template.matColor);

  // Matte bevel — subtle 3D ridge around the photo, inset into the mat
  if (template.matteBevel) {
    const bevelSize = Math.max(1, long * (template.matteBevelSize / 100));
    const strength = (template.matteBevelStrength || 50) / 100;
    const photoX = ux + frameW + matLeft, photoY = uy + frameW + matTop;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * strength})`;
    ctx.lineWidth = bevelSize;
    ctx.strokeRect(photoX - bevelSize/2, photoY - bevelSize/2, photoW + bevelSize, photoH + bevelSize);
    ctx.strokeStyle = `rgba(0,0,0,${0.35 * strength})`;
    ctx.lineWidth = bevelSize * 0.6;
    ctx.strokeRect(photoX - bevelSize, photoY - bevelSize, photoW + bevelSize*2, photoH + bevelSize*2);
    ctx.restore();
  }

  ctx.restore();

  // 6. Internal (inset) shadow — directional, drawn only in the band immediately
  // around the photo. Clipped to exclude the photo's own rect (even-odd) so the
  // shadow's fill never paints solid black *under* the photo — it relies only
  // on its blur bleeding outward from the rect edges. Previously this filled
  // the exact photo rect with opaque black and depended entirely on step 7
  // drawing over it; if that draw ever failed (decode issue, GPU quirk, etc.)
  // the result was a solid black square instead of the photo. Clipping it out
  // removes that failure mode and makes a real decode failure show as an
  // empty/transparent area instead of a misleading black block.
  const photoX = ux + frameW + matLeft;
  const photoY = uy + frameW + matTop;

  const effInternalAngle = template.matchLighting ? template.frameShadowAngle : template.internalShadowAngle;
  const effInternalBlur  = template.matchLighting ? template.frameShadowBlur  : template.internalShadowBlur;

  if (template.internalShadow) {
    const { dx, dy } = angleToOffset(effInternalAngle, long * (template.internalShadowDistance / 100));
    ctx.save();
    ctx.beginPath();
    ctx.rect(ux, uy, unitW, unitH);            // outer bound (frame/mat area)
    ctx.rect(photoX, photoY, photoW, photoH);  // inner hole — the photo itself
    ctx.clip("evenodd");                       // shadow can only paint outside the photo
    ctx.shadowColor = `rgba(0,0,0,${template.internalShadowOpacity / 100})`;
    ctx.shadowBlur = long * (effInternalBlur / 100);
    ctx.shadowOffsetX = dx;
    ctx.shadowOffsetY = dy;
    ctx.fillStyle = "#000";
    ctx.fillRect(photoX, photoY, photoW, photoH); // shadow source shape; its blur bleeds into the clipped band
    ctx.restore();
  }

  // 7. Photo
  ctx.save();
  if (template.cornerStyle === "rounded-photo-only") {
    const pr = Math.round(short * (template.cornerRadius / 100));
    roundRectPath(ctx, photoX, photoY, photoW, photoH, pr);
    ctx.clip();
  } else if (isCircle && frameW === 0 && matLeft === 0 && matTop === 0) {
    // Pure circle crop with no mat/frame
    ctx.beginPath(); ctx.arc(photoX + photoW/2, photoY + photoH/2, Math.min(photoW,photoH)/2, 0, Math.PI*2); ctx.clip();
  }
  console.log("[safelight-print-mat] drawing photo:", { photoX, photoY, photoW, photoH,
    cropCanvasSize: [cropCanvas.width, cropCanvas.height], srcBitmapSize: [srcBitmap.width, srcBitmap.height] });
  ctx.drawImage(cropCanvas, photoX, photoY, photoW, photoH);
  try {
    const px = ctx.getImageData(Math.round(photoX + photoW / 2), Math.round(photoY + photoH / 2), 1, 1).data;
    console.log("[safelight-print-mat] pixel sample at photo center (main canvas, after drawImage):", Array.from(px));
  } catch (err) {
    console.error("[safelight-print-mat] could not sample pixel from main canvas:", err);
  }
  ctx.restore();

  // 8. Text fields — multiple fields sharing the same anchor are stacked
  // vertically (in the order they appear in the template) instead of being
  // drawn on top of each other.
  const drawSpacedText = (txt, x, y, spacing, align) => {
    let chars = txt.split("");
    let totalWidth = chars.reduce((w, c) => w + ctx.measureText(c).width + spacing, -spacing);
    let startX = align === "right" ? x - totalWidth : align === "center" ? x - totalWidth / 2 : x;
    let cx = startX;
    for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing; }
  };

  const resolvedFields = template.textFields
    .filter(f => f.enabled)
    .map(f => ({ field: f, text: resolveFieldText(f, photo) }))
    .filter(f => f.text);

  const byAnchor = {};
  for (const item of resolvedFields) {
    (byAnchor[item.field.anchor] = byAnchor[item.field.anchor] || []).push(item);
  }

  const padX = matLeft * 0.3 + long * 0.008;
  const lineGap = Math.max(2, long * 0.004);

  for (const anchor of Object.keys(byAnchor)) {
    const group = byAnchor[anchor];

    let x, align;
    if (anchor.includes("left"))   { x = ux + frameW + padX; align = "left"; }
    if (anchor.includes("right"))  { x = ux + unitW - frameW - padX; align = "right"; }
    if (anchor.includes("center")) { x = ux + unitW / 2; align = "center"; }

    const isBottom = anchor.includes("bottom");
    const baseY = isBottom
      ? uy + unitH - frameW - matBottom / 2
      : uy + frameW + matTop / 2;

    // The mat band this group has to fit in (top mat for top anchors, bottom
    // mat for bottom anchors). If the stacked lines don't fit, shrink them
    // together rather than letting them spill out over the photo.
    const availableBand = (isBottom ? matBottom : matTop) * 0.9;

    let lineHeights = group.map(({ field }) =>
      Math.max(8, Math.round(long * (field.fontSize / 100))) * 1.3
    );
    let requiredHeight = lineHeights.reduce((a, b) => a + b, 0) + (group.length - 1) * lineGap;

    let scale = 1;
    if (availableBand > 0 && requiredHeight > availableBand) {
      scale = Math.max(0.55, availableBand / requiredHeight);
      lineHeights = lineHeights.map(h => h * scale);
      requiredHeight = requiredHeight * scale;
    }

    const ys = new Array(group.length);
    if (isBottom) {
      // Last field in the group sits on the edge; earlier ones stack upward above it.
      ys[group.length - 1] = baseY;
      for (let i = group.length - 2; i >= 0; i--) {
        ys[i] = ys[i + 1] - (lineHeights[i + 1] / 2 + lineHeights[i] / 2 + lineGap * scale);
      }
    } else {
      // First field sits on the edge; later ones stack downward below it.
      ys[0] = baseY;
      for (let i = 1; i < group.length; i++) {
        ys[i] = ys[i - 1] + (lineHeights[i - 1] / 2 + lineHeights[i] / 2 + lineGap * scale);
      }
    }

    // Safety net: even after shrinking, clip drawing to the mat band so text
    // can never visually spill onto the photo (e.g. if the mat is extremely
    // narrow or the minimum 55% scale floor still doesn't fully fit).
    ctx.save();
    ctx.beginPath();
    if (isBottom) {
      ctx.rect(ux, uy + unitH - frameW - matBottom, unitW, matBottom);
    } else {
      ctx.rect(ux, uy + frameW, unitW, matTop);
    }
    ctx.clip();

    group.forEach(({ field, text }, i) => {
      const fontSize = Math.max(6, Math.round(long * (field.fontSize / 100) * scale));
      ctx.font = `${fontSize}px ${field.fontFamily}`;
      ctx.fillStyle = field.color;
      ctx.textBaseline = "middle";
      drawSpacedText(text, x, ys[i], field.letterSpacing, align);
    });

    ctx.restore();
  }

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
}

// ── Activation ─────────────────────────────────────────────────────────────────
export function activate(api) {
  console.log("%c[safelight-print-mat] extension loaded — version 3.5.2", "color:#C15F3C;font-weight:bold");
  const { react: React, stores } = api;
  const { useState, useEffect, useCallback, useRef } = React;
  const ce = (type, props, ...ch) => React.createElement(type, props, ...ch);

  // Inline SVG icons (instead of emoji) so they render consistently across
  // platforms and pick up the panel's theme color via currentColor.
  const ICONS = {
    reset: "M12 5V2L7 7l5 5V8c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5H5c0 3.87 3.13 7 7 7s7-3.13 7-7-3.13-7-7-7z",
    save:  "M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zM12 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM15 9H5V5h10v4z",
    image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  };
  const Icon = (name, size = 14) => ce("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor",
    style: { flexShrink: 0 },
  }, ce("path", { d: ICONS[name] }));

  function swatchStyle(p) {
    const base = p.color || "#ffffff";
    if (p.texture === "wood")     return `linear-gradient(100deg, ${base}, #00000022)`;
    if (p.texture === "terrazzo") return `radial-gradient(circle, #fff3 10%, ${base} 11%)`;
    if (p.texture === "grass")    return `repeating-linear-gradient(90deg, ${base}, #00000011 1px, ${base} 2px)`;
    if (p.texture === "linen")    return `repeating-linear-gradient(45deg, ${base}, #00000010 2px, ${base} 4px)`;
    return base;
  }

  // Angle dial component — drag to set shadow direction
  function AngleDial({ angle, onChange }) {
    const ref = useRef(null);
    const [dragging, setDragging] = useState(false);

    const setFromEvent = (e) => {
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      onChange(Math.round(deg));
    };

    useEffect(() => {
      if (!dragging) return;
      const move = (e) => setFromEvent(e);
      const up = () => setDragging(false);
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    }, [dragging]);

    const rad = (angle * Math.PI) / 180;
    const r = 28;
    const dotX = 35 + Math.cos(rad) * r;
    const dotY = 35 + Math.sin(rad) * r;

    return ce("div", {
      ref, style: S.dial,
      onMouseDown: (e) => { setDragging(true); setFromEvent(e); }
    },
      ce("div", { style: { ...S.dialDot, left: dotX - 4, top: dotY - 4 } }),
      ce("div", {
        style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                 fontSize: 9, color: "var(--color-text-muted)" }
      }, `${angle}°`)
    );
  }

  function PrintMatPanel() {
    const [templates, setTemplates] = useState(loadTemplates);
    const [activeIdx, setActiveIdx] = useState(0);
    const [newName,   setNewName]   = useState("");
    const [showNew,   setShowNew]   = useState(false);
    const [activePhoto, setActivePhoto] = useState(null);
    const [previewing,  setPreviewing]  = useState(false);
    const [previewUrl,  setPreviewUrl]  = useState(null);
    const [tab, setTab] = useState("presets");

    const t = templates[activeIdx] || templates[0];

    // Keep track of which template is "active" outside React state too, so the
    // export processor (which has no access to this component's state) always
    // applies the template the user actually has selected/edited — not just
    // whichever template happens to be first in the saved list.
    useEffect(() => {
      if (t?.id) saveActiveTemplateId(t.id);
    }, [t?.id]);

    useEffect(() => {
      const store = stores.useCatalogStore;
      const sync = state => {
        const id = state.activePhotoId;
        setActivePhoto(id ? state.photos.find(p => p.id === id) : null);
      };
      const unsub = store.subscribe(sync);
      sync(store.getState());
      return unsub;
    }, []);

    // ── Live preview while in Develop ──────────────────────────────────────
    // Instead of relying solely on the (unedited) thumbnail behind "Generate
    // Preview", mirror the live edit state and re-render through the exact
    // same captureFrame the WebGL renderer uses — so the preview always
    // matches what export will actually produce, updating as edits change.
    const [developParams, setDevelopParams] = useState(null);
    const [activeModule,  setActiveModule]  = useState("library");
    useEffect(() => {
      const devStore = stores.useDevelopStore;
      const uiStore  = stores.useUIStore;
      if (!devStore || !uiStore) return;
      const syncDev = state => setDevelopParams(state.params || null);
      const syncUI  = state => setActiveModule(state.activeModule);
      const unsubDev = devStore.subscribe(syncDev);
      const unsubUI  = uiStore.subscribe(syncUI);
      syncDev(devStore.getState());
      syncUI(uiStore.getState());
      return () => { unsubDev(); unsubUI(); };
    }, []);

    const update = (key, val) => {
      setTemplates(prev => {
        const next = prev.map((x, i) => {
          if (i !== activeIdx) return x;
          const u = { ...x, [key]: val };
          if (x.linked && ["matWidthTop","matWidthRight","matWidthBottom","matWidthLeft"].includes(key)) {
            u.matWidthTop = u.matWidthRight = u.matWidthBottom = u.matWidthLeft = val;
          }
          if (key === "frameShadowAngle" && x.matchLighting) u.internalShadowAngle = val;
          return u;
        });
        saveTemplates(next);
        return next;
      });
    };

    const updateField = (fieldId, key, val) => {
      setTemplates(prev => {
        const next = prev.map((x, i) => {
          if (i !== activeIdx) return x;
          return { ...x, textFields: x.textFields.map(f => f.id === fieldId ? { ...f, [key]: val } : f) };
        });
        saveTemplates(next);
        return next;
      });
    };

    const addField = () => {
      setTemplates(prev => {
        const next = prev.map((x, i) => i === activeIdx
          ? { ...x, textFields: [...x.textFields, DEFAULT_TEXT_FIELD()] } : x);
        saveTemplates(next);
        return next;
      });
    };
    const removeField = (fieldId) => {
      setTemplates(prev => {
        const next = prev.map((x, i) => i === activeIdx
          ? { ...x, textFields: x.textFields.filter(f => f.id !== fieldId) } : x);
        saveTemplates(next);
        return next;
      });
    };

    const addTemplate = (name) => {
      if (!name || !name.trim()) return;
      setShowNew(false); setNewName("");
      setTemplates(prev => {
        const base = loadUserDefaults() ? { ...freshTemplate(), ...loadUserDefaults() } : freshTemplate();
        const next = [...prev, { ...base, id: Date.now().toString(), name: name.trim(),
                                  textFields: base.textFields.map(f => ({ ...f, id: f.id + "_" + Date.now() })) }];
        saveTemplates(next);
        setActiveIdx(next.length - 1);
        return next;
      });
    };

    const applyPresetObj = (preset) => {
      const built = buildPreset(preset.over);
      setTemplates(prev => {
        const next = prev.map((x, i) => i === activeIdx
          ? { ...built, id: x.id, name: x.name } : x);
        saveTemplates(next);
        return next;
      });
      setTab("mat");
    };

    const applyTexturePreset = (p) => {
      update("matColor", p.color);
      update("matTexture", p.texture);
      setTab("mat");
    };

    const deleteTemplate = () => {
      if (templates.length <= 1) return;
      setTemplates(prev => {
        const next = prev.filter((_, i) => i !== activeIdx);
        saveTemplates(next);
        setActiveIdx(Math.max(0, activeIdx - 1));
        return next;
      });
    };

    const saveAsDefaults = () => { saveUserDefaults(t); };
    const resetToDefaults = () => {
      const def = loadUserDefaults();
      const base = def ? { ...freshTemplate(), ...def } : freshTemplate();
      setTemplates(prev => {
        const next = prev.map((x, i) => i === activeIdx
          ? { ...base, id: x.id, name: x.name,
              textFields: base.textFields.map(f => ({ ...f, id: f.id + "_" + Date.now() })) }
          : x);
        saveTemplates(next);
        return next;
      });
    };

    useEffect(() => {
      return api.registerExportProcessor({
        id: "safelight-print-mat.processor",
        label: "Print Mat",
        async process(blob, photo) {
          console.log("[safelight-print-mat] export processor invoked for", photo?.filename || "(unknown photo)");
          const tpls = loadTemplates();
          const tpl = resolveExportTemplate(tpls);
          if (!tpl || tpl.enabled === false) {
            console.log("[safelight-print-mat] no active/enabled template — export left unmodified");
            return blob; // "Enable print mat" off — leave export untouched
          }
          try {
            return await renderPrintMat(blob, tpl, photo);
          } catch (err) {
            console.error("[safelight-print-mat] renderPrintMat failed — returning unmodified export:", err);
            return blob;
          }
        },
      });
    }, []);

    const buildPreviewBlob = useCallback(async () => {
      // In Develop, with a live edit session for the active photo, render
      // through the same off-screen path the WebGL pipeline/export uses —
      // this reflects current edits and exactly matches export output.
      if (activeModule === "develop" && developParams && api.develop?.captureFrame) {
        const bitmap = await api.develop.captureFrame(developParams);
        const cv = new OffscreenCanvas(bitmap.width, bitmap.height);
        cv.getContext("2d").drawImage(bitmap, 0, 0);
        return cv.convertToBlob({ type: "image/jpeg", quality: 0.92 });
      }
      // Library (or no live session): fall back to the catalog thumbnail.
      // Note: thumbnails don't carry develop edits, so this preview shows
      // the unedited photo even though the actual export applies edits.
      if (activePhoto?.thumbnailUrl) {
        const resp = await fetch(activePhoto.thumbnailUrl);
        return resp.blob();
      }
      const canvas = new OffscreenCanvas(800, 533);
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 800, 533);
      grad.addColorStop(0, "#3C3836"); grad.addColorStop(1, "#1C1917");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 533);
      ctx.fillStyle = "#B1ADA1"; ctx.font = "32px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Sample Photo", 400, 266);
      return canvas.convertToBlob({ type: "image/jpeg" });
    }, [activeModule, developParams, activePhoto]);

    const generatePreview = useCallback(async () => {
      setPreviewing(true);
      try {
        const blob = await buildPreviewBlob();
        const resultBlob = await renderPrintMat(blob, t, activePhoto || { exif: {
          make: "NIKON CORPORATION", model: "NIKON D5300", lensModel: "70-300mm f/4.5-6.3",
          aperture: 6.3, shutter: 1/640, iso: 100,
        }, dateCreated: Date.now() });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(resultBlob));
      } catch (err) {
        console.error("[safelight-print-mat] preview error:", err);
      } finally {
        setPreviewing(false);
      }
    }, [t, activePhoto, previewUrl, buildPreviewBlob]);

    // Auto-refresh while actively editing in Develop, debounced so a slider
    // drag doesn't re-render on every tick. Library keeps the manual button
    // only (no live edit state to react to there).
    const liveTimerRef = useRef(null);
    useEffect(() => {
      if (activeModule !== "develop" || !developParams || !api.develop?.captureFrame) return;
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
      liveTimerRef.current = setTimeout(() => { generatePreview(); }, 400);
      return () => clearTimeout(liveTimerRef.current);
      // eslint-disable-next-line
    }, [developParams, activeModule, t]);

    const fieldSourceLabel = {
      custom: "Custom text", camera: "Camera (EXIF)", datetime: "Date & time (EXIF)",
      lens: "Lens (EXIF)", settings: "Exposure settings (EXIF)",
    };

    const TABS = [
      { id: "presets", label: "Presets" },
      { id: "canvas",  label: "Canvas" },
      { id: "crop",    label: "Crop" },
      { id: "mat",     label: "Mat" },
      { id: "frame",   label: "Frame" },
      { id: "shadow",  label: "Shadow" },
      { id: "text",    label: "Text" },
    ];

    return ce("div", { style: S.container },

      ce("div", { style: S.sectionTitle }, "Templates"),
      ce("div", { style: { marginBottom: 6 } },
        ...templates.map((tp, i) =>
          ce("span", {
            key: tp.id, style: i === activeIdx ? S.tagActive : S.tag,
            onClick: () => setActiveIdx(i),
            onDoubleClick: () => { setActiveIdx(i); setNewName(tp.name); setShowNew("rename"); },
            title: "Click to select · Double-click to rename"
          }, tp.name)
        )
      ),
      showNew === "rename" || showNew === true
        ? ce("div", { style: { display: "flex", gap: 6, marginBottom: 10, alignItems: "center" } },
            ce("input", {
              style: { ...S.inputText, width: 120 }, type: "text",
              placeholder: showNew === true ? "Template name…" : "Rename…",
              value: newName, autoFocus: true,
              onChange: e => setNewName(e.target.value),
              onKeyDown: e => {
                if (e.key === "Enter") {
                  if (showNew === true) addTemplate(newName);
                  else {
                    setTemplates(prev => {
                      const next = prev.map((x, i) => i === activeIdx ? { ...x, name: newName.trim() } : x);
                      saveTemplates(next); return next;
                    });
                    setShowNew(false); setNewName("");
                  }
                }
                if (e.key === "Escape") { setShowNew(false); setNewName(""); }
              }
            }),
            ce("button", { style: S.btnAccent, onClick: () => {
              if (showNew === true) addTemplate(newName);
              else {
                setTemplates(prev => {
                  const next = prev.map((x, i) => i === activeIdx ? { ...x, name: newName.trim() } : x);
                  saveTemplates(next); return next;
                });
                setShowNew(false); setNewName("");
              }
            }}, "Save"),
            ce("button", { style: S.btn, onClick: () => { setShowNew(false); setNewName(""); } }, "Cancel"),
          )
        : ce("div", { style: { display: "flex", gap: 6, marginBottom: 10 } },
            ce("button", { style: S.btn, onClick: () => { setNewName(`Mat ${templates.length + 1}`); setShowNew(true); } }, "+ New"),
            ce("button", { style: S.btnDanger, onClick: deleteTemplate }, "Delete"),
          ),

      ce("hr", { style: S.divider }),

      ce("div", { style: S.row },
        ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
          ce("input", { type: "checkbox", style: S.checkbox,
                        checked: t.enabled, onChange: e => update("enabled", e.target.checked) }),
          "Enable print mat"
        )
      ),

      ce("hr", { style: S.divider }),

      ce("div", { style: { display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" } },
        ...TABS.map(tb => ce("button", {
          key: tb.id, style: tab === tb.id ? S.btnAccent : S.btn, onClick: () => setTab(tb.id),
        }, tb.label))
      ),

      // ── PRESETS ──
      tab === "presets" && ce("div", null,
        ce("div", { style: S.sectionTitle }, "Frame & Layout Presets"),
        ce("div", null,
          ...PRESETS.map((p, i) => ce("div", { key: i, style: S.presetCard, onClick: () => applyPresetObj(p) },
            ce("div", { style: {
              ...S.presetSwatch,
              background: p.over.frameStyle ? FRAME_COLORS[p.over.frameStyle] : (p.over.matColor || "#ffffff"),
              padding: p.over.frameStyle ? 4 : 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }},
              ce("div", { style: {
                width: "100%", height: "100%", background: p.over.matColor || "#ffffff",
                borderRadius: (p.over.cornerStyle === "rounded" || p.over.cornerStyle === "circle") ? (p.over.cornerStyle === "circle" ? "50%" : 6) : 0,
              }})
            ),
            ce("div", { style: S.presetLabel }, p.name)
          ))
        ),
        ce("div", { style: { ...S.sectionTitle, marginTop: 14 } }, "Mat Textures"),
        ce("div", null,
          ...TEXTURE_PRESETS.map((p, i) => ce("div", {
            key: i, style: S.presetCard, onClick: () => applyTexturePreset(p)
          },
            ce("div", { style: { ...S.presetSwatch, background: swatchStyle(p) } }),
            ce("div", { style: S.presetLabel }, p.name)
          ))
        ),
        ce("div", { style: S.defaultsRow },
          ce("button", { style: { ...S.btn, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" },
                        onClick: resetToDefaults }, Icon("reset"), "Reset to Defaults"),
          ce("button", { style: { ...S.btn, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" },
                        onClick: saveAsDefaults }, Icon("save"), "Save as Defaults"),
        ),
      ),

      // ── CANVAS ──
      tab === "canvas" && ce("div", null,
        ce("div", { style: { ...S.label, marginBottom: 8, fontSize: 10, lineHeight: 1.4 } },
          "The canvas is the background stage your framed photo sits on. Leave as \"Match photo\" to skip it."),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Canvas ratio"),
          ce("select", { style: S.select, value: t.canvasRatio,
                         onChange: e => update("canvasRatio", e.target.value) },
            ...CANVAS_RATIOS.map(r => ce("option", { key: r.id, value: r.id }, r.label))
          )
        ),
        t.canvasRatio !== "auto" && ce("div", null,
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Canvas color"),
            ce("input", { type: "color", style: S.colorInput,
                          value: t.canvasColor, onChange: e => update("canvasColor", e.target.value) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Canvas texture"),
            ce("select", { style: S.select, value: t.canvasTexture,
                           onChange: e => update("canvasTexture", e.target.value) },
              ...TEXTURES.map(tex => ce("option", { key: tex.id, value: tex.id }, tex.label))
            )
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Photo scale (%)"),
            ce("input", { style: S.input, type: "number", min: 5, max: 100,
                          value: t.photoScale, onChange: e => update("photoScale", Number(e.target.value)) })
          ),
        ),
      ),

      // ── CROP ──
      tab === "crop" && ce("div", null,
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Crop ratio"),
          ce("select", { style: S.select, value: t.cropRatio,
                         onChange: e => update("cropRatio", e.target.value) },
            ...CROP_RATIOS.map(r => ce("option", { key: r.id, value: r.id }, r.label))
          )
        ),
        t.cropRatio !== "auto" && ce("div", { style: S.row },
          ce("span", { style: S.label }, "Crop position"),
          ce("input", { style: { ...S.input, width: 100 }, type: "range", min: 0, max: 1, step: 0.05,
                        value: t.cropOffset, onChange: e => update("cropOffset", Number(e.target.value)) })
        ),
        ce("div", { style: { ...S.label, fontSize: 10, marginTop: 6 } },
          "Tip: combine Square (1:1) crop with Circle corners (Frame tab) for a circular photo."),
      ),

      // ── MAT ──
      tab === "mat" && ce("div", null,
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Mat color"),
          ce("input", { type: "color", style: S.colorInput,
                        value: t.matColor, onChange: e => update("matColor", e.target.value) })
        ),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Texture"),
          ce("select", { style: S.select, value: t.matTexture,
                         onChange: e => update("matTexture", e.target.value) },
            ...TEXTURES.map(tex => ce("option", { key: tex.id, value: tex.id }, tex.label))
          )
        ),
        ce("hr", { style: S.divider }),
        ce("div", { style: S.row },
          ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
            ce("input", { type: "checkbox", style: S.checkbox,
                          checked: t.linked, onChange: e => update("linked", e.target.checked) }),
            "Link all sides"
          )
        ),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Top (%)"),
          ce("input", { style: S.input, type: "number", min: 0, max: 30, step: 0.5,
                        value: t.matWidthTop, onChange: e => update("matWidthTop", Number(e.target.value)) })
        ),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Right (%)"),
          ce("input", { style: S.input, type: "number", min: 0, max: 30, step: 0.5,
                        value: t.matWidthRight, onChange: e => update("matWidthRight", Number(e.target.value)) })
        ),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Bottom (%)"),
          ce("input", { style: S.input, type: "number", min: 0, max: 30, step: 0.5,
                        value: t.matWidthBottom, onChange: e => update("matWidthBottom", Number(e.target.value)) })
        ),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Left (%)"),
          ce("input", { style: S.input, type: "number", min: 0, max: 30, step: 0.5,
                        value: t.matWidthLeft, onChange: e => update("matWidthLeft", Number(e.target.value)) })
        ),
        ce("hr", { style: S.divider }),
        ce("div", { style: S.sectionTitle }, "Matte Bevel (3D edge)"),
        ce("div", { style: S.row },
          ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
            ce("input", { type: "checkbox", style: S.checkbox,
                          checked: t.matteBevel, onChange: e => update("matteBevel", e.target.checked) }),
            "Enable matte bevel"
          )
        ),
        t.matteBevel && ce("div", null,
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Bevel size (%)"),
            ce("input", { style: S.input, type: "number", min: 0.1, max: 3, step: 0.1,
                          value: t.matteBevelSize, onChange: e => update("matteBevelSize", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Strength (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 100,
                          value: t.matteBevelStrength, onChange: e => update("matteBevelStrength", Number(e.target.value)) })
          ),
        ),
      ),

      // ── FRAME ──
      tab === "frame" && ce("div", null,
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Frame style"),
          ce("select", { style: S.select, value: t.frameStyle,
                         onChange: e => update("frameStyle", e.target.value) },
            ...FRAME_STYLES.map(f => ce("option", { key: f.id, value: f.id }, f.label))
          )
        ),
        t.frameStyle !== "none" && ce("div", { style: S.row },
          ce("span", { style: S.label }, "Frame width (%)"),
          ce("input", { style: S.input, type: "number", min: 0.2, max: 8, step: 0.1,
                        value: t.frameWidth, onChange: e => update("frameWidth", Number(e.target.value)) })
        ),
        ce("hr", { style: S.divider }),
        ce("div", { style: S.sectionTitle }, "Corners"),
        ce("div", { style: S.row },
          ce("span", { style: S.label }, "Corner style"),
          ce("select", { style: S.select, value: t.cornerStyle,
                         onChange: e => update("cornerStyle", e.target.value) },
            ...CORNER_STYLES.map(c => ce("option", { key: c.id, value: c.id }, c.label))
          )
        ),
        (t.cornerStyle === "rounded" || t.cornerStyle === "rounded-photo-only") && ce("div", { style: S.row },
          ce("span", { style: S.label }, "Radius (%)"),
          ce("input", { style: S.input, type: "number", min: 0.5, max: 15, step: 0.5,
                        value: t.cornerRadius, onChange: e => update("cornerRadius", Number(e.target.value)) })
        ),
        t.cornerStyle === "circle" && ce("div", { style: { ...S.label, fontSize: 10 } },
          "Set Crop ratio to 1:1 in the Crop tab for a perfect circle."),
      ),

      // ── SHADOW ──
      tab === "shadow" && ce("div", null,
        ce("div", { style: S.sectionTitle }, "Frame Shadow (drop shadow, for display)"),
        ce("div", { style: S.row },
          ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
            ce("input", { type: "checkbox", style: S.checkbox,
                          checked: t.frameShadow, onChange: e => update("frameShadow", e.target.checked) }),
            "Enable frame shadow"
          )
        ),
        t.frameShadow && ce("div", null,
          ce(AngleDial, { angle: t.frameShadowAngle, onChange: a => update("frameShadowAngle", a) }),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Blur (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 10, step: 0.5,
                          value: t.frameShadowBlur, onChange: e => update("frameShadowBlur", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Distance (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 6, step: 0.1,
                          value: t.frameShadowDistance, onChange: e => update("frameShadowDistance", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Opacity (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 100,
                          value: t.frameShadowOpacity, onChange: e => update("frameShadowOpacity", Number(e.target.value)) })
          ),
        ),
        ce("hr", { style: S.divider }),
        ce("div", { style: S.sectionTitle }, "Internal Shadow (inside frame, over photo)"),
        ce("div", { style: S.row },
          ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
            ce("input", { type: "checkbox", style: S.checkbox,
                          checked: t.internalShadow, onChange: e => update("internalShadow", e.target.checked) }),
            "Enable internal shadow"
          )
        ),
        t.internalShadow && ce("div", null,
          ce("div", { style: S.row },
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: t.matchLighting, onChange: e => update("matchLighting", e.target.checked) }),
              "Match Lighting (sync to frame shadow)"
            )
          ),
          !t.matchLighting && ce(AngleDial, { angle: t.internalShadowAngle, onChange: a => update("internalShadowAngle", a) }),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Blur (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 10, step: 0.1,
                          value: t.internalShadowBlur, onChange: e => update("internalShadowBlur", Number(e.target.value)),
                          disabled: t.matchLighting })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Distance (%)"),
            ce("input", { style: S.input, type: "number", min: -5, max: 5, step: 0.1,
                          value: t.internalShadowDistance, onChange: e => update("internalShadowDistance", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Opacity (%)"),
            ce("input", { style: S.input, type: "number", min: 0, max: 100,
                          value: t.internalShadowOpacity, onChange: e => update("internalShadowOpacity", Number(e.target.value)) })
          ),
        ),
      ),

      // ── TEXT ──
      tab === "text" && ce("div", null,
        ...t.textFields.map(field => ce("div", { key: field.id, style: S.fieldCard },
          ce("div", { style: S.fieldHeader },
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center" } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.enabled,
                            onChange: e => updateField(field.id, "enabled", e.target.checked) }),
              fieldSourceLabel[field.source]
            ),
            ce("button", { style: { ...S.btnDanger, padding: "2px 8px" },
                          onClick: () => removeField(field.id) }, "×")
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Source"),
            ce("select", { style: S.select, value: field.source,
                           onChange: e => updateField(field.id, "source", e.target.value) },
              ce("option", { value: "custom" },   "Custom text"),
              ce("option", { value: "camera" },   "Camera (EXIF)"),
              ce("option", { value: "datetime" }, "Date & time (EXIF)"),
              ce("option", { value: "lens" },     "Lens (EXIF)"),
              ce("option", { value: "settings" }, "Exposure settings (EXIF)"),
            )
          ),
          field.source === "custom" && ce("div", { style: S.row },
            ce("span", { style: S.label }, "Text"),
            ce("input", { style: S.inputText, type: "text", value: field.customText,
                          placeholder: "e.g. Stolwijk",
                          onChange: e => updateField(field.id, "customText", e.target.value) })
          ),
          field.source === "datetime" && ce("div", { style: { ...S.row, justifyContent: "flex-start", gap: 14 } },
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.showDate !== false,
                            onChange: e => updateField(field.id, "showDate", e.target.checked) }),
              "Date"
            ),
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.showTime !== false,
                            onChange: e => updateField(field.id, "showTime", e.target.checked) }),
              "Time"
            )
          ),
          field.source === "datetime" && ce("div", { style: S.row },
            ce("span", { style: S.label }, "Language"),
            ce("select", { style: S.select, value: field.dateLocale || "system",
                           onChange: e => updateField(field.id, "dateLocale", e.target.value) },
              ...DATE_LOCALES.map(l => ce("option", { key: l.id, value: l.id }, l.label))
            )
          ),
          field.source === "datetime" && (field.dateLocale === "custom") && ce("div", { style: S.row },
            ce("span", { style: S.label }, "Locale code"),
            ce("input", { style: S.inputText, type: "text", value: field.dateLocaleCustom || "",
                          placeholder: "e.g. nl-NL, de-AT, ja-JP",
                          onChange: e => updateField(field.id, "dateLocaleCustom", e.target.value) })
          ),
          field.source === "settings" && ce("div", { style: { ...S.row, justifyContent: "flex-start", gap: 12, flexWrap: "wrap" } },
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.showAperture !== false,
                            onChange: e => updateField(field.id, "showAperture", e.target.checked) }),
              "Aperture"
            ),
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.showShutter !== false,
                            onChange: e => updateField(field.id, "showShutter", e.target.checked) }),
              "Shutter speed"
            ),
            ce("label", { style: { ...S.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 } },
              ce("input", { type: "checkbox", style: S.checkbox,
                            checked: field.showIso !== false,
                            onChange: e => updateField(field.id, "showIso", e.target.checked) }),
              "ISO"
            )
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Position"),
            ce("select", { style: S.select, value: field.anchor,
                           onChange: e => updateField(field.id, "anchor", e.target.value) },
              ...ANCHORS.map(a => ce("option", { key: a, value: a },
                a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())))
            )
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Font"),
            ce("select", { style: S.select, value: field.fontFamily,
                           onChange: e => updateField(field.id, "fontFamily", e.target.value) },
              ...FONTS.map(f => ce("option", { key: f.id, value: f.id }, f.label))
            )
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Size (%)"),
            ce("input", { style: S.input, type: "number", min: 0.5, max: 6, step: 0.1,
                          value: field.fontSize, onChange: e => updateField(field.id, "fontSize", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Letter spacing"),
            ce("input", { style: S.input, type: "number", min: 0, max: 10, step: 0.5,
                          value: field.letterSpacing, onChange: e => updateField(field.id, "letterSpacing", Number(e.target.value)) })
          ),
          ce("div", { style: S.row },
            ce("span", { style: S.label }, "Color"),
            ce("input", { type: "color", style: S.colorInput,
                          value: field.color, onChange: e => updateField(field.id, "color", e.target.value) })
          ),
        )),
        ce("button", { style: { ...S.btn, width: "100%", marginBottom: 10 }, onClick: addField }, "+ Add text field"),
        (() => {
          // Heuristic, panel-side check (mirrors the render-time math in % terms,
          // since both font size and mat width are percentages of the photo's
          // long edge — the actual pixel size cancels out). Warns *before*
          // export/preview instead of only fixing it silently afterwards.
          const groups = {};
          t.textFields.filter(f => f.enabled).forEach(f => {
            (groups[f.anchor] = groups[f.anchor] || []).push(f);
          });
          const overflowing = Object.entries(groups).filter(([anchor, fields]) => {
            if (fields.length < 2) return false;
            const isBottom = anchor.includes("bottom");
            const available = (isBottom ? t.matWidthBottom : t.matWidthTop) * 0.9;
            const required = fields.reduce((sum, f) => sum + f.fontSize * 1.3, 0) + (fields.length - 1) * 0.4;
            return required > available;
          }).map(([anchor]) => anchor.replace(/-/g, " "));
          if (!overflowing.length) return null;
          return ce("div", { style: { ...S.label, color: "var(--color-accent)", marginBottom: 10, lineHeight: 1.4 } },
            `⚠ Text lines at "${overflowing.join(", ")}" don't fit well in the current mat width and will be shrunk/clipped. Widen the mat or reduce the font size.`
          );
        })(),
      ),

      ce("hr", { style: S.divider }),

      ce("div", { style: S.sectionTitle }, "Preview"),
      previewUrl
        ? ce("div", { style: { ...S.preview, padding: 4 } },
            ce("img", { src: previewUrl, style: { maxWidth: "100%", maxHeight: 240, borderRadius: 2 } })
          )
        : ce("div", { style: S.preview }, "Click \"Generate Preview\" to see the result"),
      ce("button", {
        style: { ...S.previewBtn, opacity: previewing ? 0.6 : 1, cursor: previewing ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 6, justifyContent: "center" },
        onClick: generatePreview, disabled: previewing,
      }, previewing ? null : Icon("image"), previewing ? "Generating…" : "Generate Preview"),
      ce("div", { style: { color: "var(--color-text-secondary)", fontSize: 10, marginTop: 6, textAlign: "center" } },
        activeModule === "develop" && developParams && api.develop?.captureFrame
          ? "Live preview — follows your edits in Develop"
          : activePhoto ? "Using selected photo (unedited thumbnail)" : "No photo selected — using sample image")
    );
  }

  // ── Develop-canvas overlay ───────────────────────────────────────────────────
  // Shows the *complete* framed result (texture, bevel, shadow, captions —
  // everything, identical to Generate Preview/export) directly over the live
  // Develop canvas as you edit. Re-rendering the full mat is too expensive to
  // do on every slider tick, so it's debounced; while a new render is being
  // computed, the previous rendered frame stays visible (no flicker back to
  // a placeholder) and only a lightweight outline is shown before the very
  // first render completes.
  function DevelopOverlay() {
    const [tpl, setTpl] = useState(() => resolveExportTemplate(loadTemplates()));
    const [photo, setPhoto] = useState(null);
    const [developParams, setDevelopParams] = useState(null);
    const [renderedUrl, setRenderedUrl] = useState(null);
    const renderedUrlRef = useRef(null);
    const debounceRef = useRef(null);

    // Template edits happen in the panel (a separate React tree/instance),
    // so — consistent with how the other Print Mat-family extensions share
    // state — poll the persisted template rather than relying on React state.
    useEffect(() => {
      const id = setInterval(() => {
        const next = resolveExportTemplate(loadTemplates());
        setTpl(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      }, 500);
      return () => clearInterval(id);
    }, []);

    useEffect(() => {
      const catStore = stores.useCatalogStore;
      const devStore = stores.useDevelopStore;
      const syncCat = state => {
        const id = state.activePhotoId;
        setPhoto(id ? state.photos.find(p => p.id === id) : null);
      };
      const syncDev = state => setDevelopParams(state.params || null);
      const unsubCat = catStore.subscribe(syncCat);
      const unsubDev = devStore.subscribe(syncDev);
      syncCat(catStore.getState());
      syncDev(devStore.getState());
      return () => { unsubCat(); unsubDev(); };
    }, []);

    const overlay = api.develop.useDevelopOverlay();
    const rect = overlay?.rect;

    // Debounced full render through the exact same path as Generate Preview/export.
    useEffect(() => {
      if (!developParams || !tpl || tpl.enabled === false || !api.develop?.captureFrame) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const bitmap = await api.develop.captureFrame(developParams);
          const cv = new OffscreenCanvas(bitmap.width, bitmap.height);
          cv.getContext("2d").drawImage(bitmap, 0, 0);
          const blob = await cv.convertToBlob({ type: "image/jpeg", quality: 0.92 });
          const resultBlob = await renderPrintMat(blob, tpl, photo || { exif: {}, dateCreated: Date.now() });
          const url = URL.createObjectURL(resultBlob);
          if (renderedUrlRef.current) URL.revokeObjectURL(renderedUrlRef.current);
          renderedUrlRef.current = url;
          setRenderedUrl(url);
        } catch (err) {
          console.error("[safelight-print-mat] develop overlay render error:", err);
        }
      }, 400);
      return () => clearTimeout(debounceRef.current);
    }, [developParams, tpl, photo]);

    useEffect(() => () => { if (renderedUrlRef.current) URL.revokeObjectURL(renderedUrlRef.current); }, []);

    if (!rect || !tpl || tpl.enabled === false) return null;

    const long  = Math.max(rect.w, rect.h);
    const short = Math.min(rect.w, rect.h);
    const frameW    = tpl.frameStyle !== "none" ? long * (tpl.frameWidth / 100) : 0;
    const matTop    = long * (tpl.matWidthTop    / 100);
    const matRight  = long * (tpl.matWidthRight  / 100);
    const matBottom = long * (tpl.matWidthBottom / 100);
    const matLeft   = long * (tpl.matWidthLeft   / 100);
    const cornerR   = tpl.cornerStyle === "rounded" ? short * (tpl.cornerRadius / 100) : 0;
    const outerW = rect.w + matLeft + matRight + frameW * 2;
    const outerH = rect.h + matTop + matBottom + frameW * 2;
    const outerRadius = cornerR ? cornerR + Math.max(matTop, matRight, matBottom, matLeft) + frameW : 0;
    const outerLeft = rect.x - matLeft - frameW;
    const outerTop  = rect.y - matTop - frameW;

    if (renderedUrl) {
      // Full, pixel-accurate framed result — same render export would produce.
      return ce("img", {
        src: renderedUrl,
        style: {
          position: "absolute", pointerEvents: "none",
          left: outerLeft, top: outerTop, width: outerW, height: outerH,
          borderRadius: outerRadius, objectFit: "fill",
        },
      });
    }

    // Before the first render completes: a lightweight solid-color placeholder
    // outline, so there's still some immediate visual feedback.
    const matBoxStyle = {
      position: "absolute", pointerEvents: "none", boxSizing: "border-box",
      left: rect.x - matLeft, top: rect.y - matTop,
      width: rect.w + matLeft + matRight, height: rect.h + matTop + matBottom,
      borderStyle: "solid", borderColor: tpl.matColor || "#ffffff",
      borderWidth: `${matTop}px ${matRight}px ${matBottom}px ${matLeft}px`,
      borderRadius: cornerR ? cornerR + Math.max(matTop, matRight, matBottom, matLeft) : 0,
    };
    const frameBoxStyle = frameW > 0 ? {
      position: "absolute", pointerEvents: "none", boxSizing: "border-box",
      left: outerLeft, top: outerTop, width: outerW, height: outerH,
      borderStyle: "solid", borderColor: FRAME_COLORS[tpl.frameStyle] || "#1a1a1a", borderWidth: frameW,
      borderRadius: outerRadius,
    } : null;

    return ce("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } },
      frameBoxStyle && ce("div", { style: frameBoxStyle }),
      ce("div", { style: matBoxStyle }),
    );
  }

  api.registerSlot({
    id: "safelight-print-mat.develop-overlay",
    slot: "develop-canvas-overlay",
    component: DevelopOverlay,
  });

  api.registerPanel({
    id: "safelight-print-mat.panel",
    title: "Print Mat",
    component: PrintMatPanel,
    defaultLocation: "right",
  });
}

export function deactivate() {}
