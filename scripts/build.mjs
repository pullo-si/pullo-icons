// npm run build (first half): src/<name>/ -> assets/<weight>/<name>-<weight>.svg and
// icons.json in Iconify JSON format. How the sources are drawn: CONTRIBUTING.md.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateIconSet } from "@iconify/utils";
import { STROKE, WEIGHTS, drawingFile, meta, names, phosphorBody, pkg, root, src, suffix } from "./common.mjs";
import { outline } from "./outline.mjs";

// Phosphor's categories (@phosphor-icons/core), without "brands": no logos here.
const CATEGORIES = [
  "arrows", "commerce", "communications", "design", "technology & development", "editor",
  "finances", "games", "health & wellness", "maps & travel", "media", "nature", "objects",
  "office", "people", "system", "weather",
];

function check(name, m) {
  const fail = (why) => {
    throw new Error(`src/${name}/meta.json: ${why}`);
  };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail("name the folder in lowercase-with-dashes");
  if (!m.deprecated && WEIGHTS.some((w) => phosphorBody(name, w))) {
    fail(`Phosphor has "${name}": use theirs and deprecate ours (CONTRIBUTING.md)`);
  }
  if (!Array.isArray(m.tags) || !m.tags.length) fail("tags: at least one search word");
  if (!m.categories?.length || m.categories.some((c) => !CATEGORIES.includes(c))) {
    fail(`categories: one or more of ${CATEGORIES.join(", ")}`);
  }
  const phosphorLink = /^https:\/\/github\.com\/phosphor-icons\//;
  if (m.phosphorRequest !== null && !phosphorLink.test(m.phosphorRequest)) {
    fail("phosphorRequest: a github.com/phosphor-icons/... link, or null when there is none");
  }
  if (m.phosphorPlanned && !phosphorLink.test(m.phosphorPlanned)) {
    fail("phosphorPlanned: the github.com/phosphor-icons/... link where Phosphor says theirs is coming");
  }
  if (m.deprecated && !phosphorBody(m.deprecated.phosphor)) {
    fail(`deprecated.phosphor: Phosphor has no "${m.deprecated.phosphor}"`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(m.addedIn)) fail("addedIn: the version that first ships it");
  for (const n of m.neighbours ?? []) if (!phosphorBody(n)) fail(`neighbours: Phosphor has no "${n}"`);
  if (m.frame && !phosphorBody(m.frame)) fail(`frame: Phosphor has no "${m.frame}"`);
}

const icons = {};
const categories = {};
rmSync(join(root, "assets"), { recursive: true, force: true });
for (const w of WEIGHTS) mkdirSync(join(root, "assets", w), { recursive: true });

for (const name of names()) {
  const m = meta(name);
  check(name, m);
  const read = (file) => readFileSync(src(name, file), "utf8");
  const lines = (weight) => {
    const file = drawingFile(name, weight);
    return outline(read(file), { strokeWidth: STROKE[weight], file: `src/${name}/${file}` });
  };

  const paths = {};
  for (const w of Object.keys(STROKE)) paths[w] = [{ d: lines(w) }];
  paths.fill = [{ d: outline(read("fill.svg"), { file: `src/${name}/fill.svg` }) }];
  // Duotone is regular plus a 20% tint under it. The tint leaves out what the lines
  // cover, so a see-through colour doesn't show darker seams where the two overlap.
  const regular = drawingFile(name, "regular");
  const tint = outline(read("duotone.svg"), {
    file: `src/${name}/duotone.svg`,
    minus: { svg: read(regular), strokeWidth: STROKE.regular, file: `src/${name}/${regular}` },
  });
  paths.duotone = [{ d: tint, opacity: ".2" }, ...paths.regular];

  for (const w of WEIGHTS) {
    const tags = paths[w].map(({ d, opacity }) => `<path d="${d}"${opacity ? ` opacity="${opacity}"` : ""}/>`);
    writeFileSync(
      join(root, "assets", w, `${name}${suffix(w)}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">${tags.join("")}</svg>\n`,
    );
    // Same markup Phosphor's Iconify set uses: one path, or a group for duotone.
    const body = tags.length > 1 ? `<g fill="currentColor">${tags.join("")}</g>` : tags[0].replace("<path", '<path fill="currentColor"');
    icons[name + suffix(w)] = m.deprecated ? { body, hidden: true } : { body };
  }
  for (const c of m.categories) {
    const title = c[0].toUpperCase() + c.slice(1);
    (categories[title] ??= []).push(name);
  }
}

const iconSet = {
  prefix: "pullo",
  info: {
    name: "Pullo Icons",
    total: Object.values(icons).filter((i) => !i.hidden).length,
    version: pkg.version,
    author: { name: "Andrej Rus" },
    license: { title: "MIT", spdx: "MIT", url: "https://opensource.org/license/mit" },
    samples: ["shield-user", "clipboard-check", "check-circle-multiple"],
    height: 24,
    category: "UI Other / Mixed Grid",
    tags: ["Has Padding"],
    palette: false,
  },
  width: 256,
  height: 256,
  icons,
  categories,
  suffixes: { "": "Regular", thin: "Thin", light: "Light", bold: "Bold", fill: "Fill", duotone: "Duotone" },
};
validateIconSet(iconSet);
writeFileSync(join(root, "icons.json"), JSON.stringify(iconSet, null, 2) + "\n");
console.log(`icons.json and assets/: ${names().length} icons, ${Object.keys(icons).length} with weights`);
