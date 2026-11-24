// npm run check-phosphor: has Phosphor shipped one of our icons? For every icon that
// isn't deprecated it looks at
//   - the state of the Phosphor issues in meta.json (phosphorRequest, phosphorPlanned):
//     a closed one may mean theirs is out;
//   - the latest @iconify-json/ph on npm (not the pinned one): does it have our name?
// It prints what it finds. Only with --open-issues (the weekly workflow,
// .github/workflows/phosphor.yml) does it open an issue in our repo per icon, titled
// "Phosphor may have shipped <name>", unless one with that title is already open.
// --dry-run (the default) never writes anything.
//
// Locally, with a token so GitHub doesn't rate-limit (read-only use):
//   GH_TOKEN=$(gh auth token) npm run check-phosphor
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
for (const a of args) {
  if (!["--dry-run", "--open-issues"].includes(a)) throw new Error(`Unknown option ${a}`);
}
const openIssues = args.includes("--open-issues") && !args.includes("--dry-run");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const repo = process.env.GITHUB_REPOSITORY || "pullo-si/pullo-icons";
const WEIGHT_SUFFIXES = ["", "-thin", "-light", "-bold", "-fill", "-duotone"];

async function github(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "pullo-icons-check-phosphor",
      ...(token && { authorization: `Bearer ${token}` }),
      ...(body && { "content-type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** github.com/<owner>/<repo>/issues/<n>[#issuecomment-…] -> its issue. */
async function issueState(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:issues|pull|discussions)\/(\d+)/);
  if (!m) return { url, state: "unknown", note: "not an issue link" };
  if (url.includes("/discussions/")) return { url, state: "unknown", note: "discussion, check by hand" };
  const issue = await github(`/repos/${m[1]}/${m[2]}/issues/${m[3]}`);
  const reason = issue.state_reason ? ` (${issue.state_reason.replace("_", " ")})` : "";
  const when = issue.closed_at ? ` on ${issue.closed_at.slice(0, 10)}` : "";
  return { url, state: issue.state, note: `${issue.title}${issue.state === "closed" ? `, closed${reason}${when}` : ""}` };
}

/** icons.json of the latest @iconify-json/ph: from node_modules if that is the latest. */
function latestPhosphor() {
  const pinned = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).devDependencies["@iconify-json/ph"];
  const latest = execFileSync("npm", ["view", "@iconify-json/ph@latest", "version"], { encoding: "utf8" }).trim();
  const installed = join(root, "node_modules/@iconify-json/ph");
  if (existsSync(installed) && JSON.parse(readFileSync(join(installed, "package.json"), "utf8")).version === latest) {
    return { pinned, latest, icons: JSON.parse(readFileSync(join(installed, "icons.json"), "utf8")) };
  }
  const dir = mkdtempSync(join(tmpdir(), "pullo-ph-"));
  try {
    const file = execFileSync("npm", ["pack", `@iconify-json/ph@${latest}`, "--silent", "--pack-destination", dir], {
      encoding: "utf8",
    }).trim().split("\n").pop();
    execFileSync("tar", ["-xzf", join(dir, file), "-C", dir, "package/icons.json"]);
    return { pinned, latest, icons: JSON.parse(readFileSync(join(dir, "package/icons.json"), "utf8")) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const newer = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split("-")[0].split(".").map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

const names = readdirSync(join(root, "src"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(root, "src", e.name, "meta.json")))
  .map((e) => e.name)
  .sort();

const ph = latestPhosphor();
const phHas = (key) => Boolean(ph.icons.icons[key] || ph.icons.aliases?.[key]);
console.log(
  `@iconify-json/ph: pinned ${ph.pinned}, latest on npm ${ph.latest}` +
    (newer(ph.latest, ph.pinned) ? " (newer: Dependabot should open a PR for it)" : ""),
);

const findings = [];
for (const name of names) {
  const m = JSON.parse(readFileSync(join(root, "src", name, "meta.json"), "utf8"));
  if (m.deprecated) {
    console.log(`\n${name}: deprecated, skipped`);
    continue;
  }
  console.log(`\n${name}:`);
  const reasons = [];
  const clash = WEIGHT_SUFFIXES.map((s) => name + s).filter(phHas);
  if (clash.length) {
    console.log(`  NAME CLASH: @iconify-json/ph ${ph.latest} has ${clash.join(", ")}`);
    reasons.push(`@iconify-json/ph ${ph.latest} (latest on npm) has an icon named \`${clash[0]}\`.`);
  } else {
    console.log(`  name: not in @iconify-json/ph ${ph.latest}`);
  }
  for (const [field, url] of [["phosphorRequest", m.phosphorRequest], ["phosphorPlanned", m.phosphorPlanned]]) {
    if (!url) continue;
    const s = await issueState(url);
    console.log(`  ${field}: ${s.state.toUpperCase()} ${url} (${s.note})`);
    if (s.state === "closed") reasons.push(`\`${field}\` ${url} is closed: ${s.note}.`);
  }
  if (!m.phosphorRequest && !m.phosphorPlanned) console.log("  no Phosphor issue linked");
  if (reasons.length) findings.push({ name, reasons, meta: m });
}

console.log(`\n${findings.length ? `Needs a look: ${findings.map((f) => f.name).join(", ")}` : "Nothing changed."}`);
if (!findings.length) process.exit(0);

const titleOf = (name) => `Phosphor may have shipped ${name}`;
const issueBody = ({ name, reasons, meta: m }) =>
  [
    `The weekly Phosphor check found a change for \`${name}\`:`,
    "",
    ...reasons.map((r) => `- ${r}`),
    "",
    "Links:",
    "",
    m.phosphorRequest && `- Request: ${m.phosphorRequest}`,
    m.phosphorPlanned && `- Planned: ${m.phosphorPlanned}`,
    `- Phosphor icons: https://phosphoricons.com/?q=${encodeURIComponent(name)}`,
    `- Ours: https://github.com/${repo}/tree/main/src/${name}`,
    "",
    "Check whether Phosphor now has this icon (under any name). If it does, deprecate ours " +
      `as described in [CONTRIBUTING.md](https://github.com/${repo}/blob/main/CONTRIBUTING.md#3-draw-on-phosphors-grid) ` +
      "(`\"deprecated\": { \"phosphor\": \"<their name>\", \"since\": \"<version>\" }` in meta.json). " +
      "If it doesn't (for example the request was closed as a duplicate), update meta.json to the issue that is still open and close this one.",
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

if (!openIssues) {
  console.log("\nDry run: no issues opened. Would open:");
  for (const f of findings) console.log(`\n--- ${titleOf(f.name)}\n${issueBody(f)}`);
  process.exit(0);
}

if (!token) throw new Error("--open-issues needs GITHUB_TOKEN");
const open = [];
for (let page = 1; ; page++) {
  const batch = await github(`/repos/${repo}/issues?state=open&per_page=100&page=${page}`);
  open.push(...batch.filter((i) => !i.pull_request).map((i) => i.title));
  if (batch.length < 100) break;
}
for (const f of findings) {
  const title = titleOf(f.name);
  if (open.includes(title)) {
    console.log(`Already open: "${title}"`);
    continue;
  }
  const issue = await github(`/repos/${repo}/issues`, { method: "POST", body: { title, body: issueBody(f) } });
  console.log(`Opened ${issue.html_url}`);
}
