#!/usr/bin/env python3
"""Build boss sprite atlas from photorealistic slam frames."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BOSS_DIR = ROOT / "assets" / "boss"
SOURCE_DIR = ROOT / "assets"
CURSOR_ASSETS = Path(
    "/Users/dinamouayed/.cursor/projects/"
    "Users-dinamouayed-Desktop-Bureau-Bureau-principale-Coding-Projets-app-last-army/assets"
)

FRAME_SOURCES: dict[str, list[str]] = {
    "idle": ["boss-idle.png"],
    "windup": ["boss-windup-1.png", "boss-windup-2.png", "boss-windup-3.png"],
    "slam": ["boss-slam-mid.png", "boss-slam.png"],
    "recover": ["boss-recover.png", "boss-idle.png"],
}

# Native source frames are 1024px. Packing at 512 made the boss soft on
# iPhone 3x: 256 logical points × 3 = 768 physical px, upscaled from 512.
ATLAS_CELL = 1024
DISPLAY_CELL = 256
# Transparent inset so cubic sampling cannot bleed into the next cell.
CELL_PAD = 2
# Stay within a common GPU max-texture of 4096 on a side.
MAX_ATLAS_DIM = 4096
MAGENTA_T0 = 22.0
MAGENTA_T1 = 85.0


def resolve_source(name: str) -> Path:
    path = SOURCE_DIR / name
    if path.exists():
        return path
    cursor_path = CURSOR_ASSETS / name
    if cursor_path.exists():
        shutil.copy2(cursor_path, path)
        return path
    raise FileNotFoundError(path)


def key_magenta(img: Image.Image) -> Image.Image:
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    chroma = np.minimum(r, b) - g
    alpha = 1.0 - np.clip((chroma - MAGENTA_T0) / (MAGENTA_T1 - MAGENTA_T0), 0.0, 1.0)
    strong = (r > 180) & (b > 180) & (g < 80) & (chroma > 30)
    alpha = np.where(strong, 0.0, alpha)

    spill = 1.0 - alpha
    arr[:, :, 0] = np.clip(r - 255.0 * spill * 0.92, 0, 255)
    arr[:, :, 2] = np.clip(b - 255.0 * spill * 0.92, 0, 255)
    arr[:, :, 3] = np.clip(alpha * 255.0, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def looks_like_magenta(img: Image.Image) -> bool:
    rgb = np.asarray(img.convert("RGB"), dtype=np.int16)
    corners = np.concatenate(
        [
            rgb[:12, :12].reshape(-1, 3),
            rgb[:12, -12:].reshape(-1, 3),
            rgb[-12:, :12].reshape(-1, 3),
            rgb[-12:, -12:].reshape(-1, 3),
        ]
    )
    r, g, b = corners[:, 0], corners[:, 1], corners[:, 2]
    magenta = (r > 180) & (b > 180) & (g < 80)
    return float(magenta.mean()) > 0.6


def remove_forest(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    cv2.ellipse(
        mask,
        (w // 2, int(h * 0.52)),
        (int(w * 0.30), int(h * 0.42)),
        0,
        0,
        360,
        int(cv2.GC_PR_FGD),
        -1,
    )
    cv2.ellipse(
        mask,
        (w // 2, int(h * 0.50)),
        (int(w * 0.18), int(h * 0.28)),
        0,
        0,
        360,
        int(cv2.GC_FGD),
        -1,
    )
    border = 16
    mask[:border, :] = cv2.GC_BGD
    mask[-border:, :] = cv2.GC_BGD
    mask[:, :border] = cv2.GC_BGD
    mask[:, -border:] = cv2.GC_BGD
    mask[int(h * 0.86) :, int(w * 0.68) :] = cv2.GC_BGD

    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)

    fg_u8 = np.where(
        (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD),
        255,
        0,
    ).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_u8 = cv2.morphologyEx(fg_u8, cv2.MORPH_OPEN, kernel)
    fg_u8 = cv2.morphologyEx(fg_u8, cv2.MORPH_CLOSE, kernel, iterations=2)

    num, labels, stats, _ = cv2.connectedComponentsWithStats(fg_u8, connectivity=8)
    if num > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = 1 + int(np.argmax(areas))
        fg_u8 = np.where(labels == keep, 255, 0).astype(np.uint8)

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, sat, val = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    foliage = ((hue > 35) & (hue < 95) & (sat > 40) & (val > 25)) | (
        (val < 35) & (sat < 50)
    )
    lower = np.zeros((h, w), np.uint8)
    lower[int(h * 0.78) :, :] = 1
    leftover = (fg_u8 > 0) & foliage & (lower == 1)
    fg_u8[leftover] = 0

    fg_u8 = cv2.GaussianBlur(fg_u8, (5, 5), 0)

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = fg_u8
    return Image.fromarray(out, "RGBA")


def isolate_subject(img: Image.Image) -> Image.Image:
    if looks_like_magenta(img):
        return key_magenta(img)
    return remove_forest(img)


def load_frame(name: str) -> Image.Image:
    img = Image.open(resolve_source(name)).convert("RGBA")
    isolated = isolate_subject(img)
    inner = ATLAS_CELL - CELL_PAD * 2
    if isolated.size != (inner, inner):
        isolated = isolated.resize((inner, inner), Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (ATLAS_CELL, ATLAS_CELL), (0, 0, 0, 0))
    cell.paste(isolated, (CELL_PAD, CELL_PAD), isolated)
    return cell


def atlas_grid(frame_count: int) -> tuple[int, int]:
    cols = min(frame_count, max(1, MAX_ATLAS_DIM // ATLAS_CELL))
    rows = (frame_count + cols - 1) // cols
    if cols * ATLAS_CELL > MAX_ATLAS_DIM or rows * ATLAS_CELL > MAX_ATLAS_DIM:
        raise ValueError(
            f"Atlas {cols}x{rows} at {ATLAS_CELL}px exceeds {MAX_ATLAS_DIM}px",
        )
    return cols, rows


def main() -> None:
    original = SOURCE_DIR / "boss-ai-generated.png"
    if original.exists():
        cutout = isolate_subject(Image.open(original).convert("RGBA"))
        cutout.save(BOSS_DIR / "boss-ai-generated-cutout.png")

    frames: dict[str, list[Image.Image]] = {}
    for group, names in FRAME_SOURCES.items():
        frames[group] = [load_frame(name) for name in names]

    cell_w = ATLAS_CELL
    cell_h = ATLAS_CELL
    total_frames = sum(len(v) for v in frames.values())
    cols, rows = atlas_grid(total_frames)
    atlas = Image.new("RGBA", (cell_w * cols, cell_h * rows), (0, 0, 0, 0))

    rects: dict[str, list[dict[str, int]]] = {k: [] for k in FRAME_SOURCES}
    index = 0
    for group in FRAME_SOURCES:
        subdir = BOSS_DIR / group
        if subdir.exists():
            shutil.rmtree(subdir)
        subdir.mkdir(parents=True, exist_ok=True)
        for i, frame in enumerate(frames[group], start=1):
            col = index % cols
            row = index // cols
            x = col * cell_w
            y = row * cell_h
            atlas.paste(frame, (x, y), frame)
            rects[group].append({"x": x, "y": y, "w": cell_w, "h": cell_h})
            frame.save(subdir / f"boss_{group}_{i:02d}.png")
            index += 1

    BOSS_DIR.mkdir(parents=True, exist_ok=True)
    atlas.save(BOSS_DIR / "boss-atlas.png")

    meta = {"cellW": cell_w, "cellH": cell_h, "frames": rects}
    (BOSS_DIR / "boss-atlas.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    ts_lines = [
        "/** Generated photorealistic boss atlas. */",
        "export const BOSS_ATLAS = require('../../../assets/boss/boss-atlas.png');",
        "",
        "export interface BossFrameRect {",
        "  x: number;",
        "  y: number;",
        "  w: number;",
        "  h: number;",
        "}",
        "",
        f"export const BOSS_CELL = {{ w: {DISPLAY_CELL}, h: {DISPLAY_CELL} }} as const;",
        "",
        "export const BOSS_FRAMES = {",
    ]
    for group in FRAME_SOURCES:
        ts_lines.append(f"  {group}: [")
        for r in rects[group]:
            ts_lines.append(f"    {{ x: {r['x']}, y: {r['y']}, w: {r['w']}, h: {r['h']} }},")
        ts_lines.append("  ],")
    ts_lines.append("} as const satisfies Record<string, readonly BossFrameRect[]>;")
    ts_lines.append("")

    (ROOT / "src" / "game" / "assets" / "bossAsset.ts").write_text("\n".join(ts_lines), encoding="utf-8")

    print(
        f"Atlas {atlas.size[0]}x{atlas.size[1]} ({cols}x{rows}), "
        f"{total_frames} frames, cell {cell_w}x{cell_h}",
    )


if __name__ == "__main__":
    main()
