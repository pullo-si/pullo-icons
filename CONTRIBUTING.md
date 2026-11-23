# Drawing an icon

An icon here should look as if Phosphor had drawn it. That mostly means reusing
Phosphor's geometry and checking the result next to Phosphor icons at the sizes people
use.

## 1. Make sure it is needed

Follow "Request an icon" in the README: search Phosphor (with synonyms) and its
requests first, and check that the name isn't one of Phosphor's (`npm run build` fails
if it is).

## 2. Find the direction

For a new icon, don't refine the first idea. Sketch three to five candidates whose
silhouettes are clearly different (a different main object or arrangement, not small
variations of one), and look at them at 24 and 16 px next to the Phosphor icons they
will sit beside. Pick one with whoever asked for the icon and agree on which parts of
it stay as they are. From then on, fix one visual problem per round ("the glyph crowds
the frame in bold"), and keep the chosen candidate in every comparison so you can see
whether a change made it better.

## 3. Draw on Phosphor's grid

Each icon is a folder `src/<name>/`:

| File | What it is |
|---|---|
| `line.svg` | The centerlines. Thin, light, regular and bold are made from it |
| `fill.svg` | The fill weight, drawn separately |
| `duotone.svg` | The tinted area of the duotone weight |
| `thin.svg`, `light.svg`, `regular.svg`, `bold.svg` | Optional: a corrected drawing for one weight |
| `meta.json` | Tags, categories, the Phosphor request, notes |

**`line.svg`** is drawn with strokes only, on Phosphor's grid:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16">
    <path d="M216 112V56a8 8 0 0 0-8-8H48a8 8 0 0 0-8 8v56c0 96 88 120 88 120s88-24 88-120Z"/>
    <circle cx="128" cy="116" r="30"/>
    <path d="M84 168a55 55 0 0 1 88 0"/>
  </g>
</svg>
```

- Use `path` (`M L H V A Z C S Q`, arcs circular), `circle` and `line`. The build
  replaces the stroke width with Phosphor's: thin 8, light 12, regular 16, bold 24.
- Take the frame (shield, clipboard, circle) and the glyph (check, x, person) from the
  Phosphor icons that have them; `node_modules/@iconify-json/ph/icons.json` has every
  Phosphor icon. Phosphor ships outlines, so put your centerline in the middle of the
  outline: the light shield's outline runs from x 34 to 46, so its centerline is x 40.
- Copy sizes and clear space from siblings (`shield-check`, `calendar-check`, the
  second head in `users`). Two separate parts keep about 16 units between their edges
  in regular, as in Phosphor.
- Stay inside the area Phosphor uses: its circles reach from 24 to 232.

**Corrections per weight.** When a generated weight isn't good enough, copy `line.svg`
to `<weight>.svg` and fix it there. It is nearly always bold: the 8 units the stroke
gains eat into every gap, so ends move back or glyphs get a little smaller. Phosphor
does the same (its `clipboard-text` moves its lines down in bold, `users` shortens the
back head). Move coordinates; never scale a drawing unevenly, or the stroke stops
being exactly 8, 12, 16 or 24 units. Say what you changed and why in `notes` in
`meta.json`; the preview shows it.

**`fill.svg`** is read like a painting on white, in order:

- `fill="currentColor" stroke="currentColor"` paints the solid shape. Its stroke stays
  16, so its edge lies where regular's outer edge does.
- `stroke="#fff"` cuts lines out of it (the glyph, at regular width).
- `fill="#fff"` cuts a hole (the inside of a clipboard's clip).
- A line painted `stroke="currentColor"` stays a line, for a second object behind the
  main one.

That is how Phosphor builds its fills: `shield-check-fill` and `x-circle-fill` cut the
glyph out of the solid shape, `clipboard-fill` cuts out the clip's inside, `cards-fill`
and `copy-fill` leave the object behind as a line.

**`duotone.svg`** holds only the tinted area, painted the same way: the main shape's
centerline area, as in Phosphor's duotone, and white where the tint should stop
(`identification-badge-duotone` leaves the face out). The build puts the regular
weight on top at full strength and the tint underneath at 20 %, and trims the tint
where the lines are, so a see-through colour doesn't show a darker band along them.

**`meta.json`**:

```json
{
  "tags": ["admin", "role", "permissions"],
  "categories": ["system", "people"],
  "phosphorRequest": "https://github.com/phosphor-icons/homepage/issues/550",
  "phosphorPlanned": null,
  "addedIn": "0.1.0",
  "neighbours": ["shield", "shield-check", "shield-star", "user"],
  "frame": "shield",
  "notes": { "bold": "Why bold differs from line.svg." }
}
```

`categories` are Phosphor's (without brands). `phosphorRequest` is the request it
answers, or `null`. `phosphorPlanned` (optional) links to where Phosphor says theirs is
coming. `neighbours` are the Phosphor icons it is compared with. `frame` is the
Phosphor icon whose outline it reuses, or `null`. When Phosphor ships the icon, add
`"deprecated": { "phosphor": "<their name>", "since": "<version>" }`.

## 4. Check it

```bash
npm run build      # then open preview/index.html
npm run compare    # writes preview/compare-<name>.png and prints the checks
```

`compare` renders every weight at 16, 20 and 24 px on a 1x screen after its
neighbours, lays it over its Phosphor frame, and fails when the frame doesn't match
Phosphor's or the built outline differs from your drawing. Then go through this list:

- **Weight.** At 16, 20 and 24 px the strokes look as heavy as the neighbours', and the
  glyph doesn't turn into a blob at 16 px.
- **Frame.** In the line weights, "of Phosphor's ink uncovered" is near 0 %: your frame
  lies exactly on Phosphor's.
- **Optical centre.** Centre the glyph by eye, not by its bounding box: a check mark
  carries its weight low and to the left, a clip makes the top of a clipboard heavier.
- **Negative space.** At the smallest size it is used, every gap and counter stays
  open; on the grid that is roughly 16 units, one pixel at 16 px.
- **Joins.** Where lines meet, check for little caps, pips or hooks that stick out. A
  line that ends just short of another, or just past it, leaves one.
- **Overlaps.** Crossing strokes must not show darker where they overlap in a
  see-through colour. The build merges each weight into one path, so this only comes
  back if you hand-edit the output; still look at the icon in a 40 % grey.
- **Inactive colour.** Look at it in a light grey as well, the way disabled and
  inactive icons are shown; thin details vanish there first.
- **Exact strokes.** No uneven scaling anywhere; move points instead.

## How the build works

`scripts/build.mjs` reads each folder, and `scripts/outline.mjs` turns every drawing
into the kind of file Phosphor ships: one filled path in `fill="currentColor"`, with
the holes running the other way so the default fill rule shows them. It strokes the
centerlines with Skia (the same code browsers use to draw strokes, through
`pathkit-wasm`), merges and cuts them, and writes circles and round ends as exact SVG
arcs. Then it writes `assets/`, `icons.json` (checked with `@iconify/utils`) and the
preview.
