// Turns a source drawing (centerlines painted in currentColor and white) into the
// single filled outline Phosphor ships, with Skia's stroker and path operations
// (pathkit-wasm; browsers stroke with the same code).
//
// A drawing is read like a painting on white: in document order, every element adds
// its fill and its stroke to the result, and the ones painted white cut them away.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PathKitInit = require("pathkit-wasm/bin/pathkit.js");
// The Emscripten loader would fetch() the wasm by file path, which Node's fetch refuses.
const PK = await PathKitInit({
  wasmBinary: readFileSync(require.resolve("pathkit-wasm/bin/pathkit.wasm")),
});

const WHITE = new Set(["#fff", "#ffffff", "white"]);
// Skia strokes to a quarter of a pixel; at 16x the 256 grid that is 1/64 of a unit.
const SCALE = 16;

/** The path, circle and line elements of a drawing, with their inherited paint. */
export function parseDrawing(svg, file = "drawing") {
  if (!/viewBox="0 0 256 256"/.test(svg)) throw new Error(`${file}: viewBox must be "0 0 256 256"`);
  const stack = [{ fill: "black", stroke: "none", "stroke-width": "1" }];
  const elements = [];
  for (const [, close, tag, attrText, selfClose] of svg.matchAll(/<(\/?)([\w:?!-]+)([^>]*?)(\/?)>/g)) {
    if (tag.startsWith("?") || tag.startsWith("!")) continue;
    if (close) {
      stack.pop();
      continue;
    }
    const attrs = Object.fromEntries([...attrText.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => m.slice(1)));
    const paint = { ...stack.at(-1) };
    for (const key of ["fill", "stroke", "stroke-width"]) if (key in attrs) paint[key] = attrs[key];
    // A stroke width set below the outer group (on a nested group or an element) is
    // kept in every weight; only the outer group's width is replaced per weight.
    if ("stroke-width" in attrs && stack.length > 2) paint.fixed = true;
    for (const key of ["fill", "stroke"]) {
      const v = paint[key];
      if (v !== "none" && v !== "currentColor" && v !== "black" && !WHITE.has(v)) {
        throw new Error(`${file}: paint with currentColor or #fff, not ${key}="${v}"`);
      }
    }
    if (["path", "circle", "line"].includes(tag)) elements.push({ tag, attrs, paint });
    else if (!["svg", "g", "title", "desc"].includes(tag)) throw new Error(`${file}: <${tag}> isn't supported`);
    if (!selfClose) stack.push(paint);
  }
  return elements;
}

/**
 * Outlines a drawing into path data. `strokeWidth` replaces the drawing's own stroke
 * width: that is how one centerline drawing becomes thin, light, regular and bold.
 * A width set on a nested group or an element stays (e.g. a bold override that keeps
 * a fine detail at the regular stroke).
 * `minus` is a drawing whose outline is cut away at the end.
 */
export function outline(svg, { strokeWidth, file = "drawing", minus } = {}) {
  const circles = [];
  const result = paint(svg, { strokeWidth, file, circles });
  let shape = result;
  if (minus) shape = combine(result, paint(minus.svg, { ...minus, circles }), PK.PathOp.DIFFERENCE);
  const b = shape.getBounds();
  if (b.fLeft < 0 || b.fTop < 0 || b.fRight > 256 || b.fBottom > 256) {
    throw new Error(`${file}: the outline leaves the 256 grid`);
  }
  const d = toPathData(shape.toCmds(), circles, file);
  shape.delete();
  return d;
}

function paint(svg, { strokeWidth, file, circles }) {
  let result = PK.NewPath();
  for (const el of parseDrawing(svg, file)) {
    const geometry = geometryOf(el);
    for (const key of ["fill", "stroke"]) {
      const color = el.paint[key];
      if (color === "none") continue;
      let shape;
      if (key === "fill") {
        shape = el.tag === "line" ? PK.NewPath() : PK.FromSVGString(geometry.d);
        circles.push(...geometry.arcs);
      } else {
        const h = (el.paint.fixed ? Number(el.paint["stroke-width"]) : strokeWidth ?? Number(el.paint["stroke-width"])) / 2;
        const r = el.tag === "circle" ? Number(el.attrs.r) : 0;
        // A circle no bigger than the half-stroke strokes to a solid disc. Skia's stroker
        // would leave its inside contour as a hole, so draw the disc directly.
        shape = el.tag === "circle" && r <= h ? PK.FromSVGString(geometryOf({ tag: "circle", attrs: { ...el.attrs, r: r + h } }).d) : stroke(geometry.d, 2 * h);
        // The circles a round stroke's outline can follow: both sides of every arc and
        // a cap or join around every point the centerline passes through.
        for (const { c, r } of geometry.arcs) circles.push({ c, r: r + h }, ...(r > h ? [{ c, r: r - h }] : []));
        for (const p of geometry.points) circles.push({ c: p, r: h });
      }
      result = combine(result, shape, WHITE.has(color) ? PK.PathOp.DIFFERENCE : PK.PathOp.UNION);
    }
  }
  return result;
}

function combine(a, b, op) {
  const out = PK.MakeFromOp(a, b, op);
  a.delete();
  b.delete();
  if (!out) throw new Error("Skia couldn't combine two shapes");
  return out;
}

function stroke(d, width) {
  const p = PK.FromSVGString(d);
  p.transform(SCALE, 0, 0, 0, SCALE, 0, 0, 0, 1);
  if (!p.stroke({ width: width * SCALE, cap: PK.StrokeCap.ROUND, join: PK.StrokeJoin.ROUND })) {
    throw new Error("Skia couldn't stroke an element");
  }
  return p.transform(1 / SCALE, 0, 0, 0, 1 / SCALE, 0, 0, 0, 1);
}

// --- the drawing's own geometry ---------------------------------------------------------

/** Path data, circular arcs and points (segment ends) of an element. */
function geometryOf({ tag, attrs }) {
  if (tag === "circle") {
    const [x, y, r] = [+attrs.cx, +attrs.cy, +attrs.r];
    return {
      d: `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`,
      arcs: [{ c: [x, y], r }],
      points: [],
    };
  }
  const d = tag === "line" ? `M${attrs.x1} ${attrs.y1}L${attrs.x2} ${attrs.y2}` : attrs.d;
  const segments = parsePath(d);
  return {
    d,
    arcs: segments.filter((s) => s.type === "A"),
    points: segments.flatMap((s) => [s.p0, s.p1]),
  };
}

/** Absolute segments of an SVG path: L (also H, V, Z), A (circular only), C, Q. */
export function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const segments = [];
  let i = 0;
  let cmd = "";
  let p = [0, 0];
  let start = p;
  let prevCtrl = null;
  const num = () => Number(tokens[i++]);
  const pt = (rel) => {
    const [x, y] = [num(), num()];
    return rel ? [p[0] + x, p[1] + y] : [x, y];
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    let seg;
    if (C === "M") {
      p = start = pt(rel);
      segments.push({ type: "M", p0: p, p1: p });
      cmd = rel ? "l" : "L"; // more pairs after a move are lines
      prevCtrl = null;
      continue;
    } else if (C === "Z") {
      seg = { type: "L", p0: p, p1: start };
    } else if (C === "L") {
      seg = { type: "L", p0: p, p1: pt(rel) };
    } else if (C === "H") {
      const x = num();
      seg = { type: "L", p0: p, p1: [rel ? p[0] + x : x, p[1]] };
    } else if (C === "V") {
      const y = num();
      seg = { type: "L", p0: p, p1: [p[0], rel ? p[1] + y : y] };
    } else if (C === "C" || C === "S") {
      const c1 = C === "C" ? pt(rel) : prevCtrl ? [2 * p[0] - prevCtrl[0], 2 * p[1] - prevCtrl[1]] : p;
      const c2 = pt(rel);
      seg = { type: "C", p0: p, c1, c2, p1: pt(rel) };
    } else if (C === "Q") {
      const c1 = pt(rel);
      seg = { type: "Q", p0: p, c1, p1: pt(rel) };
    } else if (C === "A") {
      const [rx, ry, rot, large, sweep] = [num(), num(), num(), num(), num()];
      if (rx !== ry || rot !== 0) throw new Error("only circular arcs are supported");
      const p1 = pt(rel);
      seg = { type: "A", p0: p, p1, large, sweep, ...arcCenter(p, p1, rx, large, sweep) };
    } else {
      throw new Error(`path command ${cmd} isn't supported`);
    }
    prevCtrl = seg.type === "C" ? seg.c2 : null;
    segments.push(seg);
    p = seg.p1;
  }
  return segments;
}

// Endpoint to center parameterization (SVG 2, appendix B.2.4), for circles.
function arcCenter(p0, p1, r, large, sweep) {
  const [mx, my] = [(p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2];
  const half = Math.hypot(mx, my);
  const radius = Math.max(r, half);
  const k = half ? Math.sqrt(Math.max(0, radius * radius - half * half)) / half : 0;
  const sign = large === sweep ? -1 : 1;
  return { c: [(p0[0] + p1[0]) / 2 + sign * k * my, (p0[1] + p1[1]) / 2 - sign * k * mx], r: radius };
}

// --- path data out --------------------------------------------------------------------
//
// Skia's results fill even-odd and draw circles as many short curves. Before writing
// them out, each contour is turned to run against the one around it (so the default
// nonzero fill shows the holes), and runs of curves on one of the drawing's circles
// become one exact SVG arc.

const VERB = { [PK.LINE_VERB]: "L", [PK.QUAD_VERB]: "Q", [PK.CONIC_VERB]: "K", [PK.CUBIC_VERB]: "C" };

/** Contours as { start, segs: [{ type, ctrl: [...points], end, w? }] }. */
function contoursOf(cmds) {
  const contours = [];
  let cur = null;
  for (const [verb, ...a] of cmds) {
    if (verb === PK.MOVE_VERB) {
      cur = { start: [a[0], a[1]], segs: [] };
      contours.push(cur);
    } else if (verb !== PK.CLOSE_VERB) {
      const pts = [];
      for (let i = 0; i + 1 < a.length; i += 2) pts.push([a[i], a[i + 1]]);
      cur.segs.push({ type: VERB[verb], ctrl: pts.slice(0, -1), end: pts.at(-1), w: verb === PK.CONIC_VERB ? a[4] : 1 });
    }
  }
  return contours.filter((c) => c.segs.length);
}

// Control points hug the curves closely enough to tell inside from outside here.
const polygonOf = (c) => [c.start, ...c.segs.flatMap((s) => [...s.ctrl, s.end])];

const areaOf = (poly) =>
  poly.reduce((sum, [x, y], i) => {
    const [nx, ny] = poly[(i + 1) % poly.length];
    return sum + x * ny - nx * y;
  }, 0);

function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function reverse(c) {
  const ends = [c.start, ...c.segs.map((s) => s.end)];
  const segs = c.segs.map((s, i) => ({ ...s, ctrl: [...s.ctrl].reverse(), end: ends[i] })).reverse();
  return { start: ends.at(-1), segs };
}

function pointAt(p0, s, t) {
  if (s.type === "C") {
    const [a, b, e] = [s.ctrl[0], s.ctrl[1], s.end];
    const k = [(1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3];
    return [0, 1].map((i) => k[0] * p0[i] + k[1] * a[i] + k[2] * b[i] + k[3] * e[i]);
  }
  const [c, e] = [s.type === "L" ? s.end : s.ctrl[0], s.end];
  const k = [(1 - t) ** 2, 2 * t * (1 - t) * s.w, t * t];
  const sum = k[0] + k[1] + k[2];
  return [0, 1].map((i) => (k[0] * p0[i] + k[1] * c[i] + k[2] * e[i]) / sum);
}

/** The drawing's circle a curve runs along (within 0.03 units), with the arc's sweep. */
function circleOf(p0, s, circles) {
  if (s.type === "L") return null;
  const probe = [p0, ...[0.25, 0.5, 0.75].map((t) => pointAt(p0, s, t)), s.end];
  const index = circles.findIndex(({ c, r }) => probe.every((q) => Math.abs(Math.hypot(q[0] - c[0], q[1] - c[1]) - r) < 0.03));
  if (index < 0) return null;
  const { c } = circles[index];
  const angle = (q) => Math.atan2(q[1] - c[1], q[0] - c[0]);
  let turn = angle(s.end) - angle(p0);
  turn = Math.atan2(Math.sin(turn), Math.cos(turn)); // each curve turns less than half a circle
  return { index, sweep: turn > 0 ? 1 : 0, turn: Math.abs(turn) };
}

const round = (n) => Math.round(n * 100) / 100;
const fmt = (n) => String(round(n) || 0);

export function toPathData(cmds, circles = [], file = "drawing") {
  const contours = contoursOf(cmds);
  const polys = contours.map(polygonOf);
  // Outermost contours run clockwise, and each level inside flips.
  const oriented = contours.map((c, i) => {
    const depth = polys.filter((p, j) => j !== i && inside(polys[i][0], p)).length;
    return areaOf(polys[i]) > 0 === (depth % 2 === 0) ? c : reverse(c);
  });

  let out = "";
  let cur = [0, 0];
  const emit = (cmd, nums) => {
    out += cmd;
    nums.forEach((n, i) => {
      const t = fmt(n);
      out += i === 0 || t.startsWith("-") ? t : " " + t;
    });
  };
  const rel = (p) => [round(p[0]) - round(cur[0]), round(p[1]) - round(cur[1])];

  for (const contour of oriented) {
    if (out) emit("m", rel(contour.start));
    else emit("M", contour.start);
    cur = contour.start;
    let arc = null; // the arc being collected: { index, sweep, turn, end }
    const flush = () => {
      if (!arc) return;
      const { r } = circles[arc.index];
      emit("a", [r, r, 0, 0, arc.sweep, ...rel(arc.end)]);
      cur = arc.end;
      arc = null;
    };
    let p = contour.start;
    for (const [i, s] of contour.segs.entries()) {
      const last = i === contour.segs.length - 1;
      const fit = circleOf(p, s, circles);
      if (fit) {
        // Under 170 degrees an arc never needs the large-arc flag.
        if (arc && arc.index === fit.index && arc.sweep === fit.sweep && arc.turn + fit.turn < 2.96) {
          arc.turn += fit.turn;
          arc.end = s.end;
        } else {
          flush();
          arc = { ...fit, end: s.end };
        }
      } else {
        flush();
        const [dx, dy] = rel(s.end);
        if (s.type === "L") {
          if (last && dx === round(contour.start[0]) - round(cur[0]) && dy === round(contour.start[1]) - round(cur[1])) {
            // Z draws the closing line itself.
          } else if (dy === 0 && dx !== 0) emit("h", [dx]);
          else if (dx === 0 && dy !== 0) emit("v", [dy]);
          else if (dx !== 0 || dy !== 0) emit("l", [dx, dy]);
        } else if (s.type === "Q") {
          emit("q", [...rel(s.ctrl[0]), dx, dy]);
        } else if (s.type === "C") {
          emit("c", [...rel(s.ctrl[0]), ...rel(s.ctrl[1]), dx, dy]);
        } else {
          throw new Error(`${file}: a round part that follows none of the drawing's circles`);
        }
        cur = s.end;
      }
      p = s.end;
    }
    flush();
    out += "Z";
    cur = contour.start;
  }
  return out;
}
