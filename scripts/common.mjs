// What the build, preview and compare scripts share.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const require = createRequire(import.meta.url);
export const root = fileURLToPath(new URL("..", import.meta.url));
export const pkg = require("../package.json");

/** Stroke width of each line weight on the 256 grid, as in Phosphor. */
export const STROKE = { thin: 8, light: 12, regular: 16, bold: 24 };
export const WEIGHTS = ["thin", "light", "regular", "bold", "fill", "duotone"];
/** Regular has no suffix: `shield-user`, `shield-user-bold`. */
export const suffix = (weight) => (weight === "regular" ? "" : `-${weight}`);

export const src = (...parts) => join(root, "src", ...parts);
export const names = () =>
  readdirSync(src(), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
export const meta = (name) => JSON.parse(readFileSync(src(name, "meta.json"), "utf8"));

/** The line drawing a weight is made from: its override if there is one. */
export const drawingFile = (name, weight) =>
  existsSync(src(name, `${weight}.svg`)) ? `${weight}.svg` : "line.svg";

// Phosphor, for the name check and the comparisons.
const ph = require("@iconify-json/ph/icons.json");
export const phosphorBody = (name, weight = "regular") => {
  const key = name + suffix(weight);
  return (ph.icons[key] ?? ph.icons[ph.aliases?.[key]?.parent])?.body ?? null;
};
