// npm run build (second half): writes preview/index.html, a proof sheet of every icon in
// all six weights, large on the 256 grid and at 24, 20 and 16 px after its Phosphor
// neighbours. `renderPreview()` returns the page without <html>/<head>/<body>, so the
// same page can be published elsewhere.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { STROKE, WEIGHTS, drawingFile, meta, names, phosphorBody, pkg, root, suffix } from "./common.mjs";

const svg = (body, px, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 256 256" role="img" aria-label="${label}">${body}</svg>`;
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const issue = (url) => {
  const [, repo, n] = url.match(/github\.com\/phosphor-icons\/([^/]+)\/issues\/(\d+)/) ?? [];
  return `<a href="${url}">${repo ? `${repo} #${n}` : "GitHub"}</a>`;
};

/**
 * @param {{ snapshots?: Record<string, { src: string, width: number, scale: number }> }} options
 *   Per icon, an optional screenshot taken on a 1x screen (a PNG data URI), shown enlarged.
 */
export function renderPreview({ snapshots = {} } = {}) {
  const icons = JSON.parse(readFileSync(join(root, "icons.json"), "utf8")).icons;
  const list = names();
  let sections = "";
  for (const name of list) {
    const m = meta(name);
    const request = m.phosphorRequest
      ? `Answers the Phosphor request ${issue(m.phosphorRequest)}.`
      : "No Phosphor request for it yet.";
    const planned = m.phosphorPlanned
      ? ` Phosphor <a href="${m.phosphorPlanned}">plans its own</a>; once it ships, this one is deprecated in favour of theirs.`
      : "";
    const notes = Object.entries(m.notes ?? {})
      .map(([w, text]) => `<li><span class="tag">${w}</span> ${escape(text)}</li>`)
      .join("");
    let cards = "";
    for (const w of WEIGHTS) {
      const ours = icons[name + suffix(w)].body;
      const corrected = m.notes?.[w] || (STROKE[w] && drawingFile(name, w) !== "line.svg") ? '<span class="dot" title="Corrected by hand, see the note above">corrected</span>' : "";
      const strips = [24, 20, 16]
        .map(
          (px) =>
            `<div class="strip"><span class="px">${px}</span>` +
            m.neighbours.map((n) => `<span class="ph">${svg(phosphorBody(n, w), px, `Phosphor ${n} ${w}`)}</span>`).join("") +
            `<span class="ours">${svg(ours, px, `${name} ${w}`)}</span></div>`,
        )
        .join("");
      cards +=
        `<figure class="weight"><figcaption><span class="wname">${w}</span>` +
        `<span class="stroke">${STROKE[w] ? `stroke ${STROKE[w]}` : w === "fill" ? "solid" : "20% tint"}</span>${corrected}</figcaption>` +
        `<div class="plate">${svg(ours, 128, `${name} ${w}, large`)}</div><div class="strips">${strips}</div></figure>`;
    }
    const shot = snapshots[name];
    const snapshot = shot
      ? `<figure class="snapshot"><figcaption>A screenshot from a 1x screen, every pixel enlarged ${shot.scale} times: rows thin to duotone, each at 16, 20 and 24 px, ours last on the tinted square.</figcaption>` +
        `<div class="frame"><img src="${shot.src}" width="${shot.width * shot.scale}" alt="${name} on a 1x screen next to Phosphor icons"></div></figure>`
      : "";
    sections +=
      `<section class="icon" id="${name}"><header class="icon-head">` +
      `<h2><span class="prefix">pullo:</span>${name}</h2>` +
      `<p class="about">${request}${planned} Next to Phosphor's ${m.neighbours.map((n) => `<code>${n}</code>`).join(", ")}, in that order; ours is last, on the tinted square.</p>` +
      `<p class="tags">${m.tags.map(escape).join(" · ")}</p>` +
      (notes ? `<ul class="notes">${notes}</ul>` : "") +
      `</header><div class="weights">${cards}</div>${snapshot}</section>`;
  }

  return `<title>Pullo Icons Proof</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Layout: a proof sheet. One plate per icon, six weight cards across, each card a large
   drawing on the 256 grid over three strips of real sizes. */
:root {
  --paper: #f6f7f5;
  --card: #ffffff;
  --ink: #1d2320;
  --muted: #5d6762;
  --rule: #dfe3df;
  --grid: #e6ebe7;
  --accent: #2f6f5e;
  --accent-soft: #e1eee9;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #141816; --card: #1b201e; --ink: #e8ece9; --muted: #9ba7a1; --rule: #2c3330;
    --grid: #252c29; --accent: #7cc4ad; --accent-soft: #24372f; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --paper: #141816; --card: #1b201e; --ink: #e8ece9; --muted: #9ba7a1; --rule: #2c3330;
  --grid: #252c29; --accent: #7cc4ad; --accent-soft: #24372f; color-scheme: dark;
}
body {
  background: var(--paper); color: var(--ink); font: 15px/1.55 var(--sans);
  padding-block: 40px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.page { max-width: 1180px; margin: 0 auto; display: grid; gap: 56px; }
a { color: var(--accent); text-underline-offset: 2px; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
code, .tag, .px, .stroke, .prefix, .eyebrow { font-family: var(--mono); }
code { font-size: .92em; }
.intro { display: grid; gap: 14px; max-width: 68ch; }
.eyebrow { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
h1 { margin: 0; font-size: clamp(34px, 6vw, 52px); line-height: 1.05; font-weight: 600; letter-spacing: -.02em; text-wrap: balance; }
.intro p { margin: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 4px 0 0; padding: 0; list-style: none; font-size: 13px; color: var(--muted); }
.legend b { color: var(--ink); font-weight: 500; }
.credit { font-size: 13px; color: var(--muted); }
.icon { display: grid; gap: 20px; padding-top: 28px; border-top: 1px solid var(--rule); }
.icon-head { display: grid; gap: 8px; max-width: 76ch; }
h2 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -.01em; }
.prefix { font-size: 15px; font-weight: 400; color: var(--muted); margin-right: 2px; }
.about, .tags { margin: 0; }
.tags { font-size: 13px; color: var(--muted); }
.notes { margin: 4px 0 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.notes li { font-size: 14px; }
.tag { display: inline-block; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); border: 1px solid currentColor; border-radius: 3px; padding: 0 5px; margin-right: 6px; }
.weights { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
.weight {
  margin: 0; background: var(--card); border: 1px solid var(--rule); border-radius: 6px; padding: 12px;
  display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; align-items: center; min-width: 0;
}
.weight figcaption { grid-column: 1 / -1; display: flex; align-items: baseline; gap: 8px; }
.wname { font-weight: 600; }
.stroke { font-size: 11px; color: var(--muted); }
.dot { font-family: var(--mono); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-left: auto; }
.plate {
  width: 128px; aspect-ratio: 1; max-width: 100%; color: var(--ink);
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 6.25% 6.25%; box-shadow: inset 0 0 0 1px var(--grid);
}
.plate svg { display: block; width: 100%; height: auto; }
.strips { display: grid; gap: 4px; min-width: 0; }
.strip { display: flex; align-items: center; gap: 4px; }
.strip svg { display: block; }
.px { width: 20px; font-size: 10px; color: var(--muted); font-variant-numeric: tabular-nums; }
.ph, .ours { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 4px; flex: none; }
.ours { background: var(--accent-soft); }
.snapshot { margin: 0; display: grid; gap: 8px; }
.snapshot figcaption { font-size: 13px; color: var(--muted); }
.snapshot .frame { overflow-x: auto; }
.snapshot img { display: block; image-rendering: pixelated; background: #fff; border: 1px solid var(--rule); border-radius: 4px; max-width: none; }
footer { font-size: 13px; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 20px; }
@media (max-width: 480px) {
  .weights { grid-template-columns: 1fr; }
  .plate { width: 104px; }
  .ph, .ours { width: 27px; }
}
</style>
<main class="page">
  <header class="intro">
    <p class="eyebrow">Proof sheet · version ${pkg.version} · ${list.length} icons × ${WEIGHTS.length} weights</p>
    <h1>Pullo Icons</h1>
    <p>Extra icons in the style of Phosphor Icons, for the ones Phosphor doesn't have. Every icon is shown in all six weights: large on Phosphor's 256-unit grid (one square is 16 units), then at 24, 20 and 16 pixels after the Phosphor icons it will sit next to.</p>
    <ul class="legend">
      <li><b>thin</b> stroke 8</li><li><b>light</b> stroke 12</li><li><b>regular</b> stroke 16</li><li><b>bold</b> stroke 24</li>
      <li><b>fill</b> solid shape, inner lines cut out</li><li><b>duotone</b> regular over a 20% tint</li>
    </ul>
    <p>The four line weights come from one drawing each, at Phosphor's stroke widths. Fill and duotone are separate drawings built the way Phosphor builds its own; in duotone the tint stops where the lines start, so a see-through colour shows no darker seams. Weights marked <span class="dot">corrected</span> were adjusted by hand, as explained under the icon's name.</p>
    <p class="credit">Drawn on Phosphor's grid with Phosphor's shapes. Phosphor Icons (phosphoricons.com) is MIT licensed, copyright 2023 Phosphor Icons. Pullo Icons is not part of Phosphor.</p>
  </header>
  ${sections}
  <footer>Pullo Icons ${pkg.version}. MIT licence. Phosphor icons shown for comparison come from Phosphor 2.1.1.</footer>
</main>`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(join(root, "preview"), { recursive: true });
  const page = renderPreview();
  const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${page.split("</style>")[0]}</style>\n</head>\n<body>\n${page.split("</style>")[1]}\n</body>\n</html>\n`;
  writeFileSync(join(root, "preview", "index.html"), html);
  console.log("preview/index.html");
}
