#!/usr/bin/env node
/**
 * Generate the full icon package (favicon.ico, favicon-16/32/48.png,
 * icon-192/512.png, icon-192/512-maskable.png, apple-touch-icon.png,
 * mask-icon.svg) from a single source logo.
 *
 * Source:   src/assets/source-logo.png  (square PNG, transparent bg)
 * Output:   public/*
 *
 * Wired into the build via the `prebuild` npm script so shipped icons
 * always match the source. Run manually with: `bun run icons`.
 */
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("src/assets/source-logo.png");
const OUT = resolve("public");

// Maskable safe-zone background — matches the logo's blue so Android
// adaptive-icon masks blend into the mark instead of showing white edges.
const MASK_BG = { r: 56, g: 132, b: 255 };
const MASK_INNER_RATIO = 0.72;

if (!existsSync(SRC)) {
  console.error(`Missing source logo: ${SRC}`);
  process.exit(1);
}

const source = sharp(SRC).ensureAlpha();
const meta = await source.metadata();
if (meta.width !== meta.height) {
  console.warn(`  warn source logo is ${meta.width}x${meta.height} — expected square; output will be padded.`);
}

async function transparent(size, out) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(OUT, out));
  console.log(`  ok  ${out} (${size}x${size}, transparent)`);
}

async function flat(size, out, bg = { r: 255, g: 255, b: 255 }) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: bg })
    .flatten({ background: bg })
    .png()
    .toFile(resolve(OUT, out));
  console.log(`  ok  ${out} (${size}x${size}, flat)`);
}

async function maskable(size, out) {
  const inner = Math.round(size * MASK_INNER_RATIO);
  const resized = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 3, background: MASK_BG },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(resolve(OUT, out));
  console.log(`  ok  ${out} (${size}x${size}, maskable ${Math.round(MASK_INNER_RATIO * 100)}% safe zone)`);
}

// Favicons (transparent) and PWA/any-purpose icons (flat white)
await Promise.all([
  transparent(16, "favicon-16x16.png"),
  transparent(32, "favicon-32x32.png"),
  transparent(48, "favicon-48x48.png"),
  transparent(64, "favicon-64x64.png"),
  flat(180, "apple-touch-icon.png"),
  flat(192, "icon-192.png"),
  flat(512, "icon-512.png"),
  maskable(192, "icon-192-maskable.png"),
  maskable(512, "icon-512-maskable.png"),
]);

// favicon.ico bundles the small sizes
const ico = await pngToIco([
  resolve(OUT, "favicon-16x16.png"),
  resolve(OUT, "favicon-32x32.png"),
  resolve(OUT, "favicon-48x48.png"),
  resolve(OUT, "favicon-64x64.png"),
]);
writeFileSync(resolve(OUT, "favicon.ico"), ico);
console.log(`  ok  favicon.ico (${ico.length}B, 4-res)`);

// mask-icon.svg — Safari pinned tab silhouette (monochrome path).
// This is a static representation of the two-eyes mark; regenerated only
// if missing so custom edits are preserved.
const maskIconPath = resolve(OUT, "mask-icon.svg");
if (!existsSync(maskIconPath)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="3.2"/><circle cx="6.6" cy="9" r="2.6" fill="#fff"/><circle cx="10.2" cy="6.8" r="2.6" fill="#fff"/><circle cx="6.6" cy="9" r="1.1"/><circle cx="10.2" cy="6.8" r="1.1"/></svg>\n`;
  writeFileSync(maskIconPath, svg);
  console.log("  ok  mask-icon.svg (generated)");
} else {
  console.log("  ok  mask-icon.svg (kept existing)");
}

console.log("\nIcon package regenerated from src/assets/source-logo.png");
