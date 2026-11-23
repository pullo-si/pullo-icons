// npm run compare [-- <name> ...]: checks the built icons in a real browser.
//
// For every icon it writes preview/compare-<name>.png: each weight at 16, 20 and 24 px
// on a 1x screen, after its Phosphor neighbours (meta.json "neighbours"), then at 128 px,
// then laid over the Phosphor frame it reuses (meta.json "frame"; black: both, red:
// only Phosphor, blue: only ours). And it prints, per weight:
//   - "frame": the share of Phosphor's ink ours doesn't cover. Near 0 % means the frame
//     sits exactly on Phosphor's (line weights; in fill and duotone the glyph is cut out
//     or tinted, so a gap there is expected).
//   - "outline": pixels where the built outline differs from the browser stroking the
//     source drawing at that weight. Anything above 0.1 % means the build went wrong.
// It exits with an error when either check fails. Needs Chromium for playwright-core:
//   npx playwright-core install chromium
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { STROKE, WEIGHTS, drawingFile, meta, names, phosphorBody, root, src, suffix } from "./common.mjs";

const icons = JSON.parse(readFileSync(join(root, "icons.json"), "utf8")).icons;
const svg = (body, px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 256 256">${body}</svg>`;
const ours = (name, w) => icons[name + suffix(w)].body;
const stroked = (name, w) =>
  readFileSync(src(name, drawingFile(name, w)), "utf8")
    .replace(/stroke-width="\d+"/, `stroke-width="${STROKE[w]}"`)
    .replaceAll("currentColor", "#000");

const wanted = process.argv.slice(2);
const list = wanted.length ? wanted : names();
mkdirSync(join(root, "preview"), { recursive: true });

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 100 }, deviceScaleFactor: 1 });
  for (const name of list) {
    const m = meta(name);
    const grid =
      "background-image:linear-gradient(#eef 1px,transparent 1px),linear-gradient(90deg,#eef 1px,transparent 1px);background-size:8px 8px";
    let html =
      "<style>body{margin:16px;font:12px sans-serif;color:#555;background:#fff}svg{display:block}" +
      ".row{display:flex;align-items:center;gap:28px;margin-bottom:12px}.set{display:flex;align-items:center;gap:8px}" +
      ".w{width:56px}.layer{position:absolute;inset:0;mix-blend-mode:multiply}</style>" +
      `<p><b>${name}</b> after ${m.neighbours.map((n) => `ph:${n}`).join(", ")}</p>`;
    for (const w of WEIGHTS) {
      const row = [...m.neighbours.map((n) => phosphorBody(n, w)), ours(name, w)];
      html += `<div class="row"><span class="w">${w}</span>`;
      for (const px of [16, 20, 24]) html += `<div class="set">${row.map((b) => svg(b, px)).join("")}</div>`;
      html += `<div style="${grid}">${svg(ours(name, w), 128)}</div>`;
      if (m.frame) {
        html +=
          "<div style='position:relative;width:128px;height:128px'>" +
          `<div class="layer" style="color:#f00">${svg(phosphorBody(m.frame, w), 128)}</div>` +
          `<div class="layer" style="color:#00f">${svg(ours(name, w), 128)}</div></div>`;
      }
      html += "</div>";
    }
    await page.setContent(html);
    const out = join(root, "preview", `compare-${name}.png`);
    await page.screenshot({ path: out, fullPage: true });

    const report = [];
    for (const w of WEIGHTS) {
      const pairs = {};
      if (m.frame) pairs.frame = [svg(phosphorBody(m.frame, w), 1024), svg(ours(name, w), 1024)];
      if (STROKE[w]) pairs.outline = [stroked(name, w).replace("<svg", '<svg width="1024" height="1024"'), svg(ours(name, w), 1024)];
      const shares = await page.evaluate(inkShares, pairs);
      const line = [`${w.padEnd(8)}`];
      if ("frame" in shares) {
        line.push(`frame: ${shares.frame.toFixed(2)} % of Phosphor's ink uncovered`);
        if (STROKE[w] && shares.frame > 1) failed = true;
      }
      if ("outline" in shares) {
        line.push(`outline: ${shares.outline.toFixed(3)} % off the drawing`);
        if (shares.outline > 0.1) failed = true;
      }
      report.push(line.join("   "));
    }
    console.log(`${name}\n  ${report.join("\n  ")}\n  ${out}`);
  }
} finally {
  await browser.close();
}
if (failed) {
  console.error("compare: a check failed (see above)");
  process.exit(1);
}

// Runs in the page: rasterizes each pair at 1024 px. "frame" is the share of the first
// image's ink the second lacks; "outline" the share of pixels where they differ.
async function inkShares(pairs) {
  const pixels = async (s) => {
    const img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent(s.replaceAll("currentColor", "#000"));
    await img.decode();
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = ctx.canvas.height = 1024;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, 1024, 1024).data;
  };
  const result = {};
  for (const [key, pair] of Object.entries(pairs)) {
    const [a, b] = await Promise.all(pair.map(pixels));
    let ink = 0;
    let off = 0;
    for (let i = 3; i < a.length; i += 4) {
      ink += a[i] > 127;
      off += key === "frame" ? a[i] > 127 && b[i] <= 127 : Math.abs(a[i] - b[i]) > 127;
    }
    result[key] = (off / ink) * 100;
  }
  return result;
}
