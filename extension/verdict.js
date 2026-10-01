// Verdict engine: windows with scores [{ start, end, score }] -> { verdict, ranges }.
// Pure. Thresholds are the PRD's starting guesses; the benchmark (slice 09) tunes them.

const GREAT_PEAK = 0.85; // Great needs one window at least this strong...
const GREAT_SUPPORT = 0.7; // ...next to another window at least this strong.
const PARTIAL_PEAK = 0.6;
const NOT_COVERED_MAX = 0.3; // Not covered: every window below this.
const RANGE_MIN = 0.7; // windows at or above this form ranges
const MAX_RANGES = 3;
const RANGE_LEAD_SEC = 10; // start ranges early: landing early is fine, late is not

function verdictOf(scores) {
  if (!scores.length) return 'unsure';
  // A one-window video (about 3 min or less) has no neighbour, so its own score decides.
  const supported = (i) => scores.length === 1 || scores[i - 1] >= GREAT_SUPPORT || scores[i + 1] >= GREAT_SUPPORT;
  const great = scores.some((s, i) => s >= GREAT_PEAK && supported(i));
  if (great) return 'great';
  const peak = Math.max(...scores);
  if (peak >= PARTIAL_PEAK) return 'partial';
  if (peak < NOT_COVERED_MAX) return 'not-covered';
  return 'unsure';
}

// Runs of consecutive windows >= RANGE_MIN; the MAX_RANGES strongest, in time order.
function rangesOf(windows) {
  const runs = [];
  let run = null;
  for (const w of windows) {
    if (w.score < RANGE_MIN) run = null;
    else if (run) (run.end = w.end), (run.peak = Math.max(run.peak, w.score));
    else runs.push((run = { start: w.start, end: w.end, peak: w.score }));
  }
  const kept = runs.sort((a, b) => b.peak - a.peak).slice(0, MAX_RANGES);
  return kept
    .map((r, i) => ({ start: Math.max(0, r.start - RANGE_LEAD_SEC), end: r.end, peak: r.peak, strongest: i === 0 }))
    .sort((a, b) => a.start - b.start);
}

function judge(windows) {
  return { verdict: verdictOf(windows.map((w) => w.score)), ranges: rangesOf(windows) };
}

if (typeof module === 'object') module.exports = { judge, GREAT_PEAK, GREAT_SUPPORT, PARTIAL_PEAK, NOT_COVERED_MAX, RANGE_MIN, MAX_RANGES, RANGE_LEAD_SEC };
