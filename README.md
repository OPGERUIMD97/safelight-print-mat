# Safelight Print Mat

A complete photo framing toolkit for [Safelight](https://github.com/anthonyreimche/SafeLight).

## Features

### 🖼 Presets tab
- 9 ready-made presets: Classic Mat, Black/Brown Frame + Mat, Rounded Black Frame, White Passe-Partout, Rounded White Mat, Instant Film (Square), Circle Frame, Floating on Canvas
- 6 mat texture presets: Blue Grass, Green Lawn, Linen, Wood Grain, Red Felt, Turquoise Terrazzo
- **↺ Reset to Defaults** / **💾 Save as Defaults** — set your own starting point for new templates

### Canvas
- Independent background "stage" the framed photo sits on — separate ratio (square, 4:5, 16:9, etc.) and color/texture from the photo itself
- **Photo Scale** (5–100%) — shrink the framed photo within the canvas for a "floating" gallery look

### Crop
- Crop to 1:1, 4:5, 5:4, 2:3, 3:2, or 16:9 before framing
- Adjustable crop position slider
- Combine 1:1 crop + Circle corner style for a perfectly circular photo

### Mat
- Custom color + 7 procedural textures (linen, felt, wood, terrazzo, grass, paper, solid) — all canvas-generated
- Per-side width, or linked for equal margins
- **Matte Bevel** — adjustable 3D ridge around the photo, inset into the mat

### Frame
- 5 styles: none, black, brown, white, gold — with bevel highlight
- Adjustable width
- **Corners**: sharp, rounded (mat + frame), rounded (photo only), or circle

### Shadow
- **Frame Shadow** — directional drop shadow behind the whole framed unit, with a draggable angle dial, blur, distance, opacity
- **Internal Shadow** — directional inset shadow over the photo, same controls
- **Match Lighting** — sync the internal shadow's direction and softness to the frame shadow with one toggle

### Caption Text Fields
Unlimited fields: Custom text, Camera (EXIF), Date & time (EXIF), Lens (EXIF), Exposure settings (EXIF) — each with position, font, size, letter spacing, color

- **Camera (EXIF)** reads make + model generically across brands — it strips corporate suffixes ("Corporation", "Inc.", "Co., Ltd.", …) from the make and avoids duplicating the brand name when the model already includes it (e.g. Canon/Sony), instead of being hard-coded to one manufacturer.
- **Date & time (EXIF)** has independent **Date** / **Time** toggles (show either, both, or neither) and its own **Language** setting per field: *System language (automatic)* follows the OS/browser language (so May becomes "mei" in Dutch, etc.), a handful of common languages are listed directly, and **Custom (locale code)** accepts any BCP-47 locale code (e.g. `nl-NL`, `de-AT`, `ja-JP`) for full control. Falls back safely to English (UK) if an invalid code is entered.
- **Exposure settings (EXIF)** has independent **Aperture** / **Shutter speed** / **ISO** toggles — show any one, two, or all three. Shutter speed is parsed correctly whether the camera reports it as a plain number or an already-formatted fraction string.
- **Multiple fields on the same position** (e.g. two fields both set to "Bottom center") are automatically stacked vertically in the order they appear, instead of being drawn on top of each other.

### Templates
- Multiple named templates, double-click to rename
- Live preview on the selected photo or a sample image

## Changelog

### 1.0.0 — Initial release
First public release. Highlights:
- Full framing toolkit: canvas, crop ratios, mat + matte bevel, frame styles, sharp/rounded/circle corners, directional frame & internal shadows with Match Lighting, 7 procedural textures
- EXIF captions (Camera, Date & time, Lens, Exposure settings) with per-field language/locale control and per-component show/hide toggles, auto-stacking when multiple captions share a position
- Live preview in Develop that follows your edits in real time (`api.develop.captureFrame`), plus a fully rendered live overlay directly on the Develop canvas
- 9 presets, 6 mat texture presets, named templates, save/reset defaults
- Automatically applied during export and printing (via the [Print extension](https://github.com/OPGERUIMD97/safelight-print))

## Installation

In Safelight → **View → Extensions**, enter:

```
OPGERUIMD97/safelight-print-mat
```

## Export & Print integration

The active Print Mat template is automatically applied during Safelight export **and** when printing via the [Print extension](https://github.com/OPGERUIMD97/safelight-print) — no extra steps needed. Disable via the "Enable print mat" checkbox to skip it.

## How it differs from the Border extension

[Border](https://github.com/OPGERUIMD97/safelight-border) is for quick solid-color borders. Print Mat is the full framing toolkit — canvas, crop, mat, matte bevel, frame, directional shadows, textures, EXIF captions.

## License

MIT
