// Verdict engine: windows with scores [{ start, end, score }] -> { verdict, ranges }.
// Pure. Thresholds are the PRD's starting guesses; the benchmark (slice 09) tunes them.

const GREAT_PEAK = 0.85; // Great needs one window at least this strong...
const GREAT_SUPPORT = 0.7; // ...next to another window at least this strong.
const PARTIAL_PEAK = 0.6;
const NOT_COVERED_MAX = 0.3; // Not covered: every window below this.
const RANGE_MIN = 0.7; // windows at or above this form ranges
const MAX_RANGES = 3;
const RANGE_LEAD_SEC = 10; // start ranges early: landing early is fine, late is not
const THROUGHOUT_SHARE = 0.4; // relevant (>= RANGE_MIN) windows covering this much of the video: no ranges
const BROAD_GREAT_SHARE = 0.4; // broad queries (ADR 0005): Great when relevant windows cover this much

// Narrow: a strong window next to a supporting one. A one-window video (about
// 3 min or less) has no neighbour, so its own score decides.
function narrowGreat(scores) {
  const supported = (i) => scores.length === 1 || scores[i - 1] >= GREAT_SUPPORT || scores[i + 1] >= GREAT_SUPPORT;
  return scores.some((s, i) => s >= GREAT_PEAK && supported(i));
}

function verdictOf(scores, great) {
  if (!scores.length) return 'unsure';
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

// kind: 'narrow' (one concept) or 'broad' (a whole subject: Great is judged by
// coverage alone). Windows tile the video, so their spans give its duration.
function judge(windows, kind = 'narrow') {
  const span = (ws) => ws.reduce((sum, w) => sum + w.end - w.start, 0);
  const share = (min) => windows.length > 0 && span(windows.filter((w) => w.score >= RANGE_MIN)) >= min * span(windows);
  const broad = kind === 'broad';
  const throughout = share(broad ? BROAD_GREAT_SHARE : THROUGHOUT_SHARE);
  const scores = windows.map((w) => w.score);
  const bestWindow = windows.reduce((best, w) => (!best || w.score > best.score ? w : best), null);
  // Relevant throughout but starting late (e.g. an 8-minute intro): where the relevant part begins.
  const from = throughout ? Math.max(0, windows.find((w) => w.score >= RANGE_MIN).start - RANGE_LEAD_SEC) : null;
  return { verdict: verdictOf(scores, broad ? throughout : narrowGreat(scores)), ranges: throughout ? [] : rangesOf(windows), throughout, from, bestWindow };
}

// Second pass: ranges with the wide best window swapped for its scored 2-minute
// windows. If none of those reaches RANGE_MIN, the wide window stays. Fine
// windows score lower (less context), so passing ones keep the best window's
// score for ranking; otherwise weaker coarse ranges push the strongest out.
function refine(windows, best, fine) {
  const passing = fine.filter((f) => f.score >= RANGE_MIN);
  const inner = passing.length ? fine.map((f) => (passing.includes(f) ? { ...f, score: Math.max(f.score, best.score) } : f)) : [best];
  return rangesOf(windows.flatMap((w) => (w === best ? inner : [w])));
}

const SNIPPET_MAX = 280; // characters of caption text in the hover card

const clock = (sec) => {
  const s = Math.floor(sec);
  const hms = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60];
  return (hms[0] ? `${hms[0]}:${String(hms[1]).padStart(2, '0')}` : `${hms[1]}`) + `:${String(hms[2]).padStart(2, '0')}`;
};

// Hover card text for a chip. state: chip state; best: the best window
// ({ start, end, text }) for Great / Partial / Unsure; kind: 'broad' | 'narrow';
// reason: why there are no captions; why: error detail. Pure.
function hoverText({ state, best, kind, reason, why }) {
  const judged = kind ? `
Judged as: ${kind === 'broad' ? 'whole subject' : 'one topic'}` : '';
  if (state === 'not-covered') return `No part of this video's captions covers your search.${judged}`;
  if (state === 'no-captions') return `${reason === 'not English' ? 'No English captions' : 'This video has no captions'}, so Piqsy can't check it.`;
  if (state === 'error') return `Piqsy couldn't check this video${why ? `: ${why}` : '.'}`;
  if (!best?.text) return '';
  const t = best.text.replace(/\s+/g, ' ').trim();
  const cut = t.length <= SNIPPET_MAX ? t : `${t.slice(0, t.lastIndexOf(' ', SNIPPET_MAX) + 1 || SNIPPET_MAX).trim()} …`;
  return `Best part ${clock(best.start)}–${clock(best.end)}: "${cut}"${judged}`;
}

if (typeof module === 'object') module.exports = { judge, refine, hoverText, SNIPPET_MAX, THROUGHOUT_SHARE, BROAD_GREAT_SHARE, GREAT_PEAK, GREAT_SUPPORT, PARTIAL_PEAK, NOT_COVERED_MAX, RANGE_MIN, MAX_RANGES, RANGE_LEAD_SEC };
