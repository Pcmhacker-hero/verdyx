#!/usr/bin/env node
/**
 * Audit icon + manifest wiring so broken links never ship.
 *
 * Checks:
 *  1. Every icon-like <link> in src/routes/__root.tsx points at a real file in public/.
 *  2. public/manifest.webmanifest parses as JSON, and every icon.src exists in public/.
 *  3. Each PNG icon's actual pixel dimensions match its declared `sizes` (192x192 / 512x512 / 180x180).
 *  4. rel="mask-icon" resolves to an SVG.
 *
 * Exits non-zero on any failure so CI blocks the merge.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const publicDir = join(root, "public");
const rootRoute = join(root, "src/routes/__root.tsx");
const manifestPath = join(publicDir, "manifest.webmanifest");

const errors = [];
const warnings = [];
const ok = [];

function fileFromPublic(href) {
  if (!href.startsWith("/")) return null;
  return join(publicDir, href.slice(1));
}

function pngDimensions(path) {
  const buf = readFileSync(path);
  // PNG signature check
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(sig)) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

// 1) Parse __root.tsx link tags (regex is fine for our controlled head config)
const routeSrc = readFileSync(rootRoute, "utf8");
const linkBlockMatch = routeSrc.match(/links:\s*\[([\s\S]*?)\],/);
if (!linkBlockMatch) {
  errors.push(`Could not locate links: [...] block in ${rootRoute}`);
} else {
  const block = linkBlockMatch[1];
  const linkRegex = /\{\s*rel:\s*"([^"]+)"[^}]*?href:\s*"([^"]+)"[^}]*?\}/g;
  let m;
  while ((m = linkRegex.exec(block)) !== null) {
    const rel = m[1];
    const href = m[2];
    if (!/icon|manifest|mask-icon/.test(rel)) continue;
    if (/^https?:\/\//.test(href)) {
      ok.push(`link rel="${rel}" -> ${href} (remote, skipped)`);
      continue;
    }
    const filePath = fileFromPublic(href);
    if (!filePath || !existsSync(filePath)) {
      errors.push(`Missing file for <link rel="${rel}" href="${href}">`);
      continue;
    }
    // sizes check
    const sizesMatch = block.slice(m.index, m.index + m[0].length).match(/sizes:\s*"(\d+)x(\d+)"/);
    if (sizesMatch && filePath.endsWith(".png")) {
      const declared = { w: +sizesMatch[1], h: +sizesMatch[2] };
      const dims = pngDimensions(filePath);
      if (!dims) {
        errors.push(`${href}: not a valid PNG`);
      } else if (dims.width !== declared.w || dims.height !== declared.h) {
        errors.push(
          `${href}: declared sizes="${declared.w}x${declared.h}" but PNG is ${dims.width}x${dims.height}`,
        );
      } else {
        ok.push(`${href}: ${dims.width}x${dims.height} ✓`);
      }
    } else if (rel === "mask-icon" && !filePath.endsWith(".svg")) {
      errors.push(`mask-icon must be SVG, got ${href}`);
    } else {
      ok.push(`link rel="${rel}" -> ${href} ✓`);
    }
  }
}

// 2) Manifest
if (!existsSync(manifestPath)) {
  errors.push(`Missing ${manifestPath}`);
} else {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    errors.push(`manifest.webmanifest is not valid JSON: ${e.message}`);
  }
  if (manifest) {
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      errors.push("manifest.icons must be a non-empty array");
    } else {
      let sawMaskable = false;
      let sawAny = false;
      for (const icon of manifest.icons) {
        const filePath = fileFromPublic(icon.src ?? "");
        if (!filePath || !existsSync(filePath)) {
          errors.push(`manifest icon missing on disk: ${icon.src}`);
          continue;
        }
        if (icon.type === "image/png" || filePath.endsWith(".png")) {
          const dims = pngDimensions(filePath);
          if (!dims) {
            errors.push(`${icon.src}: invalid PNG`);
          } else {
            const [w, h] = String(icon.sizes ?? "").split("x").map(Number);
            if (w && h && (dims.width !== w || dims.height !== h)) {
              errors.push(
                `${icon.src}: manifest sizes="${icon.sizes}" but PNG is ${dims.width}x${dims.height}`,
              );
            } else {
              ok.push(`manifest ${icon.src} ${dims.width}x${dims.height} purpose=${icon.purpose ?? "any"} ✓`);
            }
          }
        }
        const purposes = String(icon.purpose ?? "any").split(/\s+/);
        if (purposes.includes("maskable")) sawMaskable = true;
        if (purposes.includes("any")) sawAny = true;
      }
      if (!sawMaskable) warnings.push('No icon with purpose="maskable" — Android adaptive icons will letterbox.');
      if (!sawAny) warnings.push('No icon with purpose="any" — install prompts may fall back.');
    }
    for (const key of ["name", "short_name", "start_url", "display", "theme_color", "background_color"]) {
      if (!manifest[key]) warnings.push(`manifest.${key} is empty`);
    }
  }
}

// 3) Sanity: favicon.ico exists (browser default fallback)
const favicon = join(publicDir, "favicon.ico");
if (!existsSync(favicon)) warnings.push("public/favicon.ico missing");
else ok.push(`favicon.ico ${statSync(favicon).size}B ✓`);

// Report
for (const line of ok) console.log("  ok  ", line);
for (const line of warnings) console.warn("  warn", line);
for (const line of errors) console.error("  FAIL", line);

console.log(`\nIcon audit: ${ok.length} ok, ${warnings.length} warn, ${errors.length} fail`);
if (errors.length > 0) process.exit(1);
