// Search page adapter + chip view. Runs on every youtube.com page because
// YouTube navigates in-app (home -> search never reloads the page).

const TOP_N = 5;

// state -> [icon, word]. Every state shows both, never colour alone.
const STATES = {
  pending: ['', 'Piqsy …'],
  great: ['✓', 'Great'],
  partial: ['◐', 'Partial'],
  'not-covered': ['✕', 'Not covered'],
  unsure: ['?', 'Unsure'],
  'no-captions': ['∅', 'no captions'],
  error: ['!', 'Piqsy error'],
};

function setState(chip, state) {
  const [icon, word] = STATES[state];
  chip.dataset.state = state;
  chip.textContent = icon ? `${icon} ${word}` : word;
}

const ms = (t0) => Math.round(performance.now() - t0);
const rounded = (scores) => scores.map((s) => Math.round(s * 1000) / 1000);

// Jev scores for windows, via the background worker: { scores } or { error }.
async function score(query, broad, windows) {
  try {
    return await chrome.runtime.sendMessage({ type: 'score', query, broad, texts: windows.map((w) => w.text) });
  } catch (e) {
    return { error: String(e) }; // e.g. extension reloaded under an open tab
  }
}

async function appendLog(entry) {
  try {
    await chrome.runtime.sendMessage({ type: 'log', entry });
  } catch (e) {
    console.warn('[piqsy] run log', e);
  }
}

// Learning-query check, once per query per tab: { learning, broad, learningP,
// broadP, topic, error }. A failed check falls back to chipping, narrow.
// A non-learning query gets one run-log entry (videoId null) so the threshold can be tuned.
async function checkQuery(query) {
  let r;
  try {
    r = await chrome.runtime.sendMessage({ type: 'checkQuery', query });
  } catch (e) {
    r = { error: String(e) };
  }
  if (r.error) r = { learning: true, broad: false, learningP: null, broadP: null, topic: null, error: r.error };
  console.log(`[piqsy] query "${query}": learning ${r.learningP}, broad ${r.broadP}, topic "${r.topic}"${r.error ? ` (check failed: ${r.error})` : ''} -> ${r.learning ? (r.broad ? 'broad' : 'narrow') : 'no chips'}`);
  if (!r.learning) appendLog({ ts: new Date().toISOString(), query, videoId: null, outcome: 'not-learning', learningP: r.learningP, broadP: r.broadP });
  return r;
}

const queryChecks = new Map(); // query -> { promise, result (null until settled) }

function getQueryCheck(query) {
  if (!queryChecks.has(query)) {
    const qc = { result: null };
    qc.promise = checkQuery(query).then((r) => ((qc.result = r), schedule(), r));
    queryChecks.set(query, qc);
  }
  return queryChecks.get(query);
}

// One evaluation of (query, video): captions -> windows -> Jev (via the
// background worker) -> verdict. The query check runs while captions download;
// scoring waits for it. Logs one run-log entry; returns { state, hover }
// with its hover text ('hidden' for a non-learning query: no entry, no chip).
async function evaluate(query, videoId) {
  const t0 = performance.now();
  const queryCheck = getQueryCheck(query).promise;
  const { result, cached } = await getCaptions(videoId);
  const captionMs = ms(t0);
  const qc = await queryCheck;
  if (!qc.learning) return { state: 'hidden' };
  const what = result.lines ? `${result.kind} ${result.lang}, ${result.lines.length} lines, ${result.durationSec}s video` : result.reason;
  console.log(`[piqsy] captions ${videoId}: ${what}${result.detail ? ` (${result.detail})` : ''} in ${captionMs}ms${cached ? ' [cached]' : ` (player ${result.playerMs ?? '-'}ms, text ${result.textMs ?? '-'}ms)`} [cookies ${cookieMode()}]`);
  const entry = {
    ts: new Date().toISOString(),
    query,
    videoId,
    outcome: result.lines ? 'captions' : result.reason === 'fetch failed' ? 'error' : 'no-captions',
    reason: result.reason ?? null,
    detail: result.detail ?? null,
    kind: result.kind ?? null,
    lang: result.lang ?? null,
    lines: result.lines?.length ?? null,
    durationSec: result.durationSec ?? null,
    captionMs,
    playerMs: cached ? null : (result.playerMs ?? null),
    textMs: cached ? null : (result.textMs ?? null),
    cached,
    cookieMode: cookieMode(),
    learningP: qc.learningP,
    broadP: qc.broadP,
    kind: qc.broad ? 'broad' : 'narrow',
    topic: qc.topic,
    queryError: qc.error ?? null,
    verdict: null,
    windows: null,
    jevMs: null,
    totalMs: null,
    ranges: null,
    throughout: null,
    scores: null,
    fineWindows: null,
    fineScores: null,
    jevError: null,
  };

  let best = null; // evidence for the hover card
  if (result.lines) {
    const windows = makeWindows(result.lines, result.durationSec);
    const t1 = performance.now();
    const res = await score(query, qc.broad, windows);
    Object.assign(entry, { windows: windows.length, jevMs: ms(t1) });
    if (res.error) {
      Object.assign(entry, { verdict: 'error', jevError: res.error });
    } else {
      const scored = windows.map((w, i) => ({ ...w, score: res.scores[i] }));
      const { verdict, ranges, throughout, bestWindow } = judge(scored, entry.kind);
      Object.assign(entry, { verdict, ranges, throughout, scores: rounded(res.scores) });
      best = bestWindow;
      // Second pass (long videos): 2-minute windows inside a wide best window.
      const fine = verdict === 'great' || verdict === 'partial' ? fineWindows(result.lines, bestWindow) : [];
      if (!throughout && fine.length > 1) {
        const res2 = await score(query, qc.broad, fine);
        Object.assign(entry, { fineWindows: fine.length, jevMs: ms(t1) });
        // ponytail: a failed second pass keeps the first-pass ranges; the error is logged.
        if (res2.error) entry.jevError = res2.error;
        else {
          const fineScored = fine.map((w, i) => ({ ...w, score: res2.scores[i] }));
          Object.assign(entry, { ranges: refine(scored, bestWindow, fineScored), fineScores: rounded(res2.scores) });
          best = fineScored.reduce((a, b) => (b.score > a.score ? b : a)); // a 2-minute window reads better than ~25 min
        }
      }
    }
  }
  entry.totalMs = ms(t0);
  if (entry.verdict) {
    console.log(`[piqsy] verdict ${videoId} (${entry.kind}): ${entry.verdict}${entry.jevError ? ` (${entry.jevError})` : ''}, ${entry.windows} windows${entry.fineWindows ? ` + ${entry.fineWindows} fine` : ''}${entry.throughout ? ', throughout' : ''}, Jev ${entry.jevMs}ms, total ${entry.totalMs}ms`);
  }
  await appendLog(entry);
  // For the watch-page strip. ponytail: the latest rating of a video wins, whichever search it came from.
  if (best) {
    const ranges = entry.ranges.length || entry.throughout ? entry.ranges : [{ start: best.start, end: best.end, strongest: true }]; // Partial below RANGE_MIN: its best window
    const rating = { query, verdict: entry.verdict, ranges, throughout: entry.throughout };
    chrome.runtime.sendMessage({ type: 'rated', videoId, rating }).catch(() => {});
    if (strip.videoId === videoId && !strip.el) (strip.el = makeStrip(rating)), schedule(); // result clicked while its chip was pending
  }
  const state = entry.verdict || entry.outcome;
  return { state, hover: hoverText({ state, best, kind: entry.kind, reason: entry.reason, why: entry.jevError || entry.detail }) };
}

// YouTube re-renders results right after a search, dropping and re-adding
// chips; this de-duplicates so each (query, video) is evaluated once per tab.
// ponytail: in-memory per tab, like captionCache.
const evaluations = new Map(); // `${query}\n${videoId}` -> Promise<{ state, hover }>

function getEvaluation(query, videoId) {
  const key = `${query}\n${videoId}`;
  if (!evaluations.has(key)) {
    evaluations.set(
      key,
      evaluate(query, videoId)
        .catch((e) => (console.warn('[piqsy]', e), { state: 'error', hover: hoverText({ state: 'error', why: String(e) }) }))
        .then((r) => {
          if (r.state === 'error') evaluations.delete(key); // retry next time
          return r;
        }),
    );
  }
  return evaluations.get(key);
}

async function check(chip) {
  const { state, hover } = await getEvaluation(chip.dataset.query, chip.dataset.videoId);
  if (!chip.isConnected) return;
  setState(chip, state);
  chip.title = hover; // ponytail: native tooltip (OS-styled, legible on both themes); a custom card if it proves too plain
}

function makeChip(videoId, query) {
  const chip = document.createElement('div');
  chip.className = 'piqsy-chip';
  chip.dataset.videoId = videoId;
  chip.dataset.query = query;
  setState(chip, 'pending');
  return chip;
}

function videoIdOf(renderer) {
  const href = renderer.querySelector('a#thumbnail')?.getAttribute('href') || '';
  // Shorts link to /shorts/<id>, so they yield null and are skipped.
  return href.startsWith('/watch') ? new URL(href, location.origin).searchParams.get('v') : null;
}

// First N regular videos. Direct children of a section's #contents only:
// ads, channels, playlists, mixes and Shorts shelves are other element types,
// and videos nested inside shelves ("People also watched") are excluded.
function topResults() {
  const out = [];
  for (const r of document.querySelectorAll('ytd-search ytd-item-section-renderer > #contents > ytd-video-renderer')) {
    const videoId = videoIdOf(r);
    const thumb = r.querySelector('ytd-thumbnail');
    if (videoId && thumb) out.push({ videoId, thumb });
    if (out.length === TOP_N) break;
  }
  return out;
}

// On a new search YouTube updates the URL before it swaps the results, so for
// a moment the previous query's videos sit under the new query. Chips wait
// while the results are exactly the ones last seen for another query.
// ponytail: a new query that truly returns the same top 5 gets chips after STALE_MS.
const STALE_MS = 3000;
let shown = { query: null, ids: '', staleSince: 0 };

function isStale(query, ids) {
  if (!ids) return false;
  if (query === shown.query || ids !== shown.ids) {
    shown = { query, ids, staleSince: 0 };
    return false;
  }
  if (!shown.staleSince) {
    shown.staleSince = Date.now();
    setTimeout(schedule, STALE_MS);
  }
  return Date.now() - shown.staleSince < STALE_MS;
}

// Idempotent: YouTube recycles renderer elements across searches, so a chip
// stays only while its thumbnail still shows the same video for the same query.
function sync() {
  // After ↻ on the extension, this old copy can't reach the background worker;
  // stay idle (no wasted YouTube requests) until the tab is reloaded.
  if (!chrome.runtime?.id) return;
  const off = !enabled || location.pathname !== '/results';
  const query = new URLSearchParams(location.search).get('search_query') || '';
  const results = off ? [] : topResults();
  const wanted = new Map(results.map(({ videoId, thumb }) => [thumb, videoId]));
  const hidden = queryChecks.get(query)?.result?.learning === false;

  for (const chip of document.querySelectorAll('.piqsy-chip')) {
    const thumb = chip.parentElement;
    if (hidden || wanted.get(thumb) !== chip.dataset.videoId || chip.dataset.query !== query) chip.remove();
  }
  if (off || hidden || isStale(query, results.map((r) => r.videoId).join())) return;
  const qc = getQueryCheck(query);
  const t0 = performance.now();
  const checks = [];
  for (const [thumb, videoId] of wanted) {
    if (thumb.querySelector(':scope > .piqsy-chip')) continue;
    getEvaluation(query, videoId); // start captions now, in parallel with the query check
    if (!qc.result) continue; // chips appear once the check says learning (it calls schedule())
    const chip = makeChip(videoId, query);
    thumb.append(chip);
    checks.push(check(chip));
  }
  if (checks.length) {
    Promise.all(checks).then(() => console.log(`[piqsy] ${checks.length} videos checked in parallel in ${Math.round(performance.now() - t0)}ms`));
  }
}

// Watch-page strip under the player, for Great / Partial videos rated by a
// search this browser session. Looked up once per watched video.
let strip = { videoId: null, el: null };

function makeStrip({ query, verdict, ranges, throughout }) {
  if (verdict !== 'great' && verdict !== 'partial') return null;
  const el = document.createElement('div');
  el.className = 'piqsy-strip';
  el.dataset.state = verdict;
  el.title = `Piqsy, for your search "${query}"`;
  const [icon, word] = STATES[verdict];
  el.append(`${icon} ${word} · `, throughout ? 'Relevant throughout' : 'Watch ');
  if (!throughout) {
    ranges.forEach((r, i) => {
      if (i) el.append(' · ');
      const b = document.createElement('button');
      b.textContent = `${clock(r.start)}–${clock(r.end)}`;
      if (r.strongest) b.className = 'strongest';
      b.onclick = () => {
        const video = document.querySelector('video.html5-main-video');
        if (!video) return;
        video.currentTime = r.start;
        video.play().catch(() => {});
      };
      el.append(b);
    });
  }
  return el;
}

function syncStrip() {
  const videoId = enabled && location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') : null;
  if (videoId !== strip.videoId) {
    strip.el?.remove();
    strip = { videoId, el: null };
    if (!videoId) return;
    chrome.runtime
      .sendMessage({ type: 'rating', videoId })
      .then(({ rating }) => {
        if (strip.videoId === videoId && rating) (strip.el = makeStrip(rating)), schedule();
      })
      .catch(() => {});
  }
  // YouTube re-renders the page around the player; put the strip back if it was dropped.
  const below = document.querySelector('ytd-watch-flexy #below');
  if (strip.el && below && strip.el.parentElement !== below) below.prepend(strip.el);
}

function safeSync() {
  try {
    syncStrip();
    sync();
  } catch (e) {
    console.warn('[piqsy]', e); // never let Piqsy break YouTube
  }
}

let timer = 0;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(safeSync, 150);
}

// Popup switch (popup.js). null until read, so nothing starts before we know.
let enabled = null;
chrome.storage.local.get('enabled').then(({ enabled: on }) => ((enabled = on !== false), schedule()));
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) (enabled = changes.enabled.newValue !== false), schedule();
});

new MutationObserver(schedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['href'],
});
document.addEventListener('yt-navigate-finish', schedule);
schedule();

// Demo mode for visual review: in the DevTools console on youtube.com run
//   localStorage.piqsyDemo = 1        (then reload; `delete localStorage.piqsyDemo` to stop)
// Chips cycle through every state, offset so all states are visible at once.
// ponytail: no UI toggle; the options page/popup can own this once they exist.
if (localStorage.piqsyDemo) {
  const names = Object.keys(STATES);
  let tick = 0;
  setInterval(() => {
    tick++;
    document.querySelectorAll('.piqsy-chip').forEach((chip, i) => setState(chip, names[(tick + i) % names.length]));
  }, 2000);
}
