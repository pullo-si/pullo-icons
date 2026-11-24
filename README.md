# Pullo Icons

Extra icons for [Phosphor Icons](https://phosphoricons.com): icons Phosphor doesn't have
yet, drawn in its style. They are built on Phosphor's 256-unit grid from Phosphor's own
shapes, in the same six weights, so they sit next to Phosphor icons without standing
out. The style, the grid and the shapes are Phosphor's work (MIT License, Copyright (c)
2023 Phosphor Icons). Pullo Icons is an independent project, not part of Phosphor.

- npm package `pullo-icons`, Iconify prefix `pullo`, MIT License.
- Status: 0.1.0, not published yet. `"private": true` in `package.json` keeps it from
  being published by accident; it is removed at the first release.

## Icons

Each icon comes in six weights, named the way Phosphor names them: `shield-user-thin`,
`shield-user-light`, `shield-user` (regular), `shield-user-bold`, `shield-user-fill`,
`shield-user-duotone`.

| Icon | Use it for | Phosphor request it answers |
|---|---|---|
| `shield-user` | Roles, administrators, account security | [homepage#550](https://github.com/phosphor-icons/homepage/issues/550) |
| `clipboard-check` | Checklists, sessions, finished tasks | [homepage#596](https://github.com/phosphor-icons/homepage/issues/596). Phosphor [plans its own](https://github.com/phosphor-icons/homepage/issues/970#issuecomment-6956525818); ours is deprecated when it ships |
| `check-circle-multiple` | Check all, approve all, mark all present | None yet |
| `x-circle-multiple` | Dismiss all, reject all, mark all absent | None yet |
| `file-json` | JSON files, data export and import, config | [homepage#655](https://github.com/phosphor-icons/homepage/issues/655) |
| `star-slash` | Remove from favourites, not starred | [homepage#226](https://github.com/phosphor-icons/homepage/issues/226). In Phosphor's [backlog](https://github.com/phosphor-icons/homepage/issues/226#issuecomment-3800717743); ours is deprecated when theirs ships |
| `bell-dot` | Unread notifications | [homepage#858](https://github.com/phosphor-icons/homepage/issues/858) |
| `sidebar-simple-open`, `sidebar-simple-close` | Expand and collapse a sidebar | [homepage#518](https://github.com/phosphor-icons/homepage/issues/518). Phosphor [plans arrow variants](https://github.com/phosphor-icons/homepage/issues/518#issuecomment-3812945860) |
| `magnifying-glass-x` | Clear a search, reset zoom | [homepage#708](https://github.com/phosphor-icons/homepage/issues/708) |

## Use

The package holds `icons.json` (the whole set in [Iconify JSON](https://iconify.design/docs/types/iconify-json.html)
format) and plain SVG files. There are no per-framework packages: Iconify's tools cover
the frameworks.

### unplugin-icons

```js
// vite.config.js
import Icons from "unplugin-icons/vite";
import { ExternalPackageIconLoader } from "unplugin-icons/loaders";

// The loader names the collection after the package; this calls it "pullo" instead.
const { "pullo-icons": pullo } = ExternalPackageIconLoader("pullo-icons");

export default {
  plugins: [Icons({ customCollections: { pullo } })],
};
```

```js
import ShieldUser from "~icons/pullo/shield-user-light";
```

### @iconify/vue, @iconify/react, @iconify/svelte

```js
import { addCollection, Icon } from "@iconify/vue"; // or @iconify/react, @iconify/svelte
import pullo from "pullo-icons/icons.json";

addCollection(pullo);
// <Icon icon="pullo:shield-user-light" />
```

### Plain SVG

The files follow [`@phosphor-icons/core`](https://github.com/phosphor-icons/core):
`assets/<weight>/<name>-<weight>.svg`, and regular without the suffix,
`assets/regular/<name>.svg`. They use `fill="currentColor"`, so they take the text
colour.

```js
import shieldUser from "pullo-icons/assets/light/shield-user-light.svg";
```

## Rules

- **Never a name Phosphor has.** The build fails when Phosphor's set has the name.
- **Named like Phosphor would**: lowercase with dashes, the object first and what
  changes it after: `shield-user`, `x-circle-multiple`.
- **No brand logos.**
- **Every icon records the Phosphor request it answers**, or that there is none
  (`phosphorRequest` in its `meta.json`). Phosphor is where an icon should end up.
- **When Phosphor ships its own version, ours is deprecated** and points to theirs:
  `deprecated` in `meta.json` hides it from search in `icons.json`, the table above
  names the Phosphor icon to use, and it stays in the package until the next major
  version.

## Request an icon

1. Search Phosphor first, on [phosphoricons.com](https://phosphoricons.com) and with
   synonyms. A newer Phosphor release may have it.
2. Look for the request in [Phosphor's icon requests](https://github.com/phosphor-icons/homepage/issues).
   Add your use case there, or open a request if there is none: Phosphor drawing it is
   the best outcome.
3. Open an issue here with the link to that request, what the icon is for, and the
   size you use it at.

## Build

Node 20 or later, npm.

```bash
npm install
npm run build      # src/ -> assets/, icons.json and preview/index.html (open it in a browser)
npm run compare    # checks in Chromium; once: npx playwright-core install chromium
```

`src/<name>/` holds each icon's drawings and `meta.json`; `assets/` and `icons.json`
are generated and committed. How to draw and check an icon: [CONTRIBUTING.md](CONTRIBUTING.md).

## Release

From an up-to-date `main`, push a branch named after the version:

```bash
git switch main && git pull
git switch -c release/0.2.0 && git push -u origin release/0.2.0
```

`.github/workflows/release.yml` sets the version in `package.json`, rebuilds, commits,
stages the package on npm, tags `v0.2.0`, moves `main` to the release commit, makes the
GitHub release and deletes the branch. Then approve the staged version on npmjs.com
(Staged Packages, with two-factor login); only then can it be installed. Afterwards
`git switch main && git pull`. A version with a suffix (`0.2.0-beta.1`) goes to the
`next` tag, not `latest`. npm trusts this workflow (trusted publishing), so no token is
stored anywhere.

## Thanks

- [Phosphor Icons](https://phosphoricons.com) by Helena Zhang and Tobias Fried, whose
  style, grid and shapes these icons are made of.
