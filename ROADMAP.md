# Roadmap

Which icons come next, in batches. Picked from the open requests on
[phosphor-icons/homepage](https://github.com/phosphor-icons/homepage/issues) (checked
2026-11-24: 517 open, 490 icon requests), skipping brand logos, characters and names
Phosphor has. Numbers are issue numbers there; the figure in brackets is reactions plus
comments.

Each icon goes through CONTRIBUTING.md: 3–5 directions in one weight, the maintainer
picks one, then all six weights, QA checklist, `npm run compare`, review beside
Phosphor neighbours.

Status: `todo` · `directions` (waiting for a pick) · `drawing` · `review` · `done`

## Batch 1: high demand, built from Phosphor's parts

| Icon | Request | Status | Notes |
|---|---|---|---|
| `file-json` | #655 (9) | done | Letters from `file-js` (J, S), `file-doc` (O), `file-png` (N) |
| `star-slash` | #226 (7) | done | Slash as in `bell-slash`, `eye-slash`. In Phosphor's backlog, no date (`phosphorPlanned`) |
| `bell-dot` | #858 (4) | done | Unread badge: small solid dot top right. Maybe `bell-simple-dot` too |
| `sidebar-simple-open`, `sidebar-simple-close` | #518 (7) | done | `sidebar-simple` with a caret in the content area. Phosphor: "arrow variants to the backlog" (`phosphorPlanned`) |
| `magnifying-glass-x` | #708 (3) | done | As `magnifying-glass-plus` / `-minus` |

## Our own (no Phosphor request)

| Icon | Status | Notes |
|---|---|---|
| `olive` | done | The Olivestep mark without the legs |

## Batch 2: Olivestep's stand-ins

| Icon | Request | Status | Notes |
|---|---|---|---|
| `calendar-clock` | #1026 | done | In Phosphor's backlog ([#1089](https://github.com/phosphor-icons/homepage/issues/1089#issuecomment-7046528971)). Replaces `calendar-dots` for `$calendarClock` (schedule view). B picked; bold clock at 16 |
| `user-slash` | none | done | In Phosphor's backlog ([#1089](https://github.com/phosphor-icons/homepage/issues/1089#issuecomment-7046528971)). Replaces `user-minus` for `$accountOff`. The slash rule removes the right shoulder: decide |

## Batch 3: slash and badge variants

| Icon | Request | Status | Notes |
|---|---|---|---|
| `image-slash` | #837 (4) | done | Small mountain left out |
| `map-pin-slash` | #825, #406 (4) | done | |
| `music-notes-slash` | #822 (4) | done | A picked. In Phosphor's backlog |
| `bookmark-simple-slash` | #413 | done | Only the simple one kept (2026-11-25) |
| `headphones-slash` | #1041 | done | |
| `monitor-slash` | #1091 | done | |
| `envelope-check`, `envelope-x` | #780 | done | A picked |
| `smiley-plus` | #1054 | done | Built like `user-circle-plus` |
| `clock-plus` | #470 | done | |
| `calendar-pencil` | #642 | done | A picked; bold pencil at 20 |
| `calendar-arrow-in`, `calendar-arrow-out` | #920 | done | B picked. In Phosphor's backlog |
| `calendar-arrow-clockwise` (reschedule) | #977 | done | A picked |
| `user-circle-star` | #370 | done | |
| `stack-simple-plus` | #225 | done | |
| `stack-simple-check` | none | done | Added 2026-11-25 |

## Batch 4: file types

| Icon | Request | Status |
|---|---|---|
| `file-xml` | #1039 | done |
| `file-log` | #697 | done |
| `file-php` | #565 | done |

The three end the page at y 112 like Phosphor's three-letter file icons; `file-json`
ends at 120 like `file-html`.

## Batch 5: editor and layout UI

| Icon | Request | Status | Notes |
|---|---|---|---|
| `sort-alphabetical-ascending`, `-descending` | #488 (5) | done | |
| `replay-10`, `forward-10` | #734 (3) | done | |
| `line-height` | #527 | done | |
| `letter-spacing` | #1101 | done | |
| `text-wrap`, `text-wrap-slash`, `text-overflow` | #906 | done | A's pair plus B's margin version |
| `bring-forward`, `send-backward`, `bring-to-front`, `send-to-back` | #686 | done | B picked |
| `border-top`, `-right`, `-bottom`, `-left`, `-none` | #636 | done | A picked, dashes spaced wider |
| `group`, `ungroup` | #950 | done | A picked |
| `page-break` | #824 | done | The next page's slanted corner looks odd |
| `table-of-contents` | #882 | done | A picked. In Phosphor's backlog ([#1001](https://github.com/phosphor-icons/homepage/issues/1001#issuecomment-4364848452)) |

## Batch 6: new drawings

| Icon | Request | Status | Notes |
|---|---|---|---|
| `turtle` | #276 (9) | done | |
| `steak` | #662 (7) | done | |
| `satellite`, `satellite-dish` | #585 (7) | done | |
| `bee` | #850 (6) | done | |
| `rock`, `rock-tall` | #588 (6) | done | Boulder and tall rock |
| `bow-and-arrow` | #647 (6) | done | Phosphor: "slated for next release" (2026-11-24); ours is a stand-in. String one step lighter than the bow |
| `whistle` | #530 (4) | done | |
| `dumpster` | #353 | done | |
| `helicopter` | #909 | done | |
| `restroom`, `wc` | #466 | done | Both: figures (`restroom`) and the neutral WC sign (`wc`) |
| `ethernet` | #863 | done | |
| `telescope` | #666 | done | |
| `passport` | #819 | done | Globe redrawn with parallels and a lens (2026-11-25) |
| `license-plate` | #849 | done | |
| `postcard` | #862 | done | |
| `postage-stamp` | #862 | done | Phosphor's `stamp` is the rubber stamp |

## Batch 7: icons other sets have and Phosphor lacks

Picked by comparing Lucide, Tabler, Material Symbols, Heroicons and Remix Icon with
Phosphor (names only; nothing drawn after them). The full list and runners-up are in
`drafts/batch-7/list.md` (not committed).

| Icon | Request | Status |
|---|---|---|
| `chat-plus` | #877 (backlog) | done |
| `chat-question` | #511 | done |
| `chat-warning` | #1083 | done |
| `file-check` | none | done |
| `file-question` | #524 | done |
| `folder-check` | none | done |
| `folder-arrow-up` | #153 | done |
| `user-x` | #1098 (backlog) | done |
| `copy-check` | none | done |
| `caret-down-up` | #611 | done | Carets enlarged to caret-down size (2026-11-25) |
| `bookmark-simple-plus`, `bookmark-simple-check` | none | done |
| `shield-x` | none | done |
| `sidebar-simple-right`, `sidebar-simple-bottom` | #759 | done |
| `layout-dashboard` | #617 | done |
| `tags` | #464 (backlog) | done |
| `image-plus` | #1089 (backlog, maybe next release) | done |
| `shopping-cart-plus` | #354 | done |
| `chart-area` | #878 | done | A; a filled-area variant waits for a pick |

## Parked: Phosphor said theirs is coming

Lower priority; ours would be deprecated when theirs ships (as with `clipboard-check`).

- Mini carets (#516, "next release")
- Border-radius icons (#451)
- `progress`, `progress-circle` (#649, backlog)
- `wine-bottle` (#170, backlog)
- Table edit icons (#275, "we can prioritize those")

## Skipped

Brand logos (Bluesky, Firefox, Substack, Vimeo, Discord, Claude, Gemini, …), characters
(Jake the Dog), Google's Coral objects, vague bundles and non-icon issues.
