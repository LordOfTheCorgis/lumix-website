// Keeps the page on the 40px module the cursor trail lights up.
//
// Widths were already handled in CSS (.shell snaps to whole cells). Heights
// can't be: text wraps to whatever it wraps to. So this rounds the heights
// that matter up to whole cells, and with the origin at the top of <main> and
// section padding in whole cells, every section edge, panel edge and row rule
// below it lands on a grid line. Evan, 2026-10-08: "make sure EVERYTHING is
// aligned".
//
// What gets snapped:
//   .section            every section, so the rules between them line up
//   [data-snap]         any block whose bottom edge should sit on a line
//   [data-snap="both"]  same, plus width (buttons, which size to their label)
//   .cell-split > *     both halves, so whichever stacks second on a phone
//                       starts on a line
//   .cell-stack > *     same, for stacks spaced one cell apart
//   .snap-kids > *      every child of a stack, so whatever follows lands on a
//                       line no matter how the text above it wrapped
//
// Also sets --n on <html>: how many cells wide the content column is, for the
// .cell-split utility, which needs an integer CSS can't derive from a length.

const SNAP = "[data-snap], .snap-kids > *, .cell-stack > *, .cell-split > *, .section";

function cell(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--grid-cell")) || 40;
}

function snapAll() {
  const size = cell();

  const shell = document.querySelector<HTMLElement>(".shell");
  if (shell) {
    const cs = getComputedStyle(shell);
    const inner = shell.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    document.documentElement.style.setProperty("--n", String(Math.round(inner / size)));
  }

  // Every .cell-cols grid learns its own width in cells. Done before the
  // height pass since column widths decide how text wraps.
  document.querySelectorAll<HTMLElement>(".cell-cols").forEach((g) => {
    g.style.setProperty("--c", String(Math.floor((g.clientWidth + 0.5) / size)));
  });

  // Deepest first: a section's natural height depends on the snapped heights
  // of what's inside it, so the inside has to settle before the outside.
  const els = Array.from(document.querySelectorAll<HTMLElement>(SNAP)).reverse();
  for (const el of els) {
    if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue; // hidden
    el.style.minHeight = "";
    const both = el.dataset.snap === "both";
    if (both) el.style.minWidth = "";
    const r = el.getBoundingClientRect();
    // -0.5 so a box that's already 160.2px from subpixel text doesn't get
    // bumped a whole extra cell.
    el.style.minHeight = `${Math.ceil((r.height - 0.5) / size) * size}px`;
    if (both) el.style.minWidth = `${Math.ceil((r.width - 0.5) / size) * size}px`;
  }
}

let queued = 0;
function queue() {
  if (queued) return;
  queued = requestAnimationFrame(() => {
    queued = 0;
    snapAll();
  });
}

snapAll();
window.addEventListener("load", queue);
window.addEventListener("resize", queue);
document.fonts?.ready.then(queue);
// Content that arrives later (status results, the order builder, the cookie
// banner) changes heights without a resize. Watching body catches all of it;
// once everything's snapped a pass changes nothing and it goes quiet.
new ResizeObserver(queue).observe(document.body);
