# Pullo Icons

Extra icons in the style of Phosphor Icons, for icons Phosphor doesn't have. Phosphor
(MIT, "Copyright (c) 2023 Phosphor Icons", by Tobias Fried and Helena Zhang) adds new
icons rarely: none since March 2024, about 490 requests open on
phosphor-icons/homepage. This is not a fork. We only add what Phosphor lacks, drawn to
its standard, and give it full credit: the README opens with it, and LICENSE keeps its
copyright line next to ours.

- Repo https://github.com/pullo-si/pullo-icons (org `pullo-si`, after pullo.si). npm
  package `pullo-icons` (not published; `"private": true` until the first release).
  Iconify prefix `pullo`.
- Ships `icons.json` (Iconify JSON) and plain SVGs. No per-framework packages: projects
  load the set through Iconify (unplugin-icons, @iconify/vue, @iconify/react…).
- First user: Olivestep (a Vue app). It uses light and regular from a local folder and
  switches to the package after the first npm release.

## Rules

- Never a name Phosphor has (the build fails). No brand logos.
- Every icon in all six weights, as good as Phosphor's.
- `meta.json` records the Phosphor request the icon answers. When Phosphor ships its
  own, ours gets `deprecated` (hidden in `icons.json`) and points to theirs.
- Ask before every public step: push, npm publish, opening or commenting on issues
  anywhere, an Iconify listing request.
- Commits: plain messages, no Co-Authored-By trailer. Keep the repo-local identity
  `Andrej Rus <22886512+rusko995@users.noreply.github.com>`.
- New dev dependencies: exact versions, released at least two weeks ago.

## Build

- `src/<name>/`: `line.svg` (centerlines on the 256 grid), `fill.svg`, `duotone.svg`,
  `meta.json`, optional per-weight overrides (all four icons have `bold.svg`).
- `npm run build` writes `assets/` and `icons.json` (committed, never edit by hand) and
  `preview/` (gitignored). `npm run compare` runs the browser check.
- Reuse Phosphor's geometry from `node_modules/@iconify-json/ph`: the centerline runs
  through the middle of Phosphor's outline; check frames by overlaying them.

## Drawing

The process and the QA checklist are in CONTRIBUTING.md; follow them. When working with
the maintainer:

- A new icon starts with 3–5 clearly different directions, never one refined guess.
  The maintainer picks one and says which parts stay; then one visual problem per
  round, and the favourite version stays beside each new attempt until it is done.
- Show it only beside 3–6 Phosphor neighbours in the same weight, at 16, 20 and 24 px
  on a 1x screen and enlarged, and only after the QA checklist passes.
- Restate visual feedback as an exact change before editing. A cropped screenshot is a
  precise bug report: fix that spot, don't redesign.

## Status (0.1.0, on npm since 2026-11-24)

- Icons: `shield-user` (homepage#550), `clipboard-check` (#596; Phosphor has it
  "slated for the next release", homepage#970, 2026-11-17, but hasn't shipped it; ours
  stays until theirs ships, then is deprecated), `check-circle-multiple` and
  `x-circle-multiple` (no request).
- 0.1.0 was published by hand. Later releases: the maintainer pushes `release/<version>`;
  `.github/workflows/release.yml` bumps, builds, commits, runs `npm stage publish`
  (trusted publishing, stage only: no `npm publish` permission), tags, fast-forwards
  main, makes the GitHub release; the maintainer approves the staged version on
  npmjs.com with 2FA. Steps in the README under Release.
- Next, each only with the maintainer's OK: post the drawings in the matching Phosphor
  requests; ask Iconify to list the set once it has a few dozen icons (whole sets only,
  via an issue).
