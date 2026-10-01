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

// One evaluation of (query, video): captions -> windows -> Jev (via the
// background worker) -> verdict. Logs one run-log entry; returns the chip state.
async function evaluate(query, videoId) {
  const t0 = performance.now();
  const { result, cached } = await getCaptions(videoId);
  const captionMs = ms(t0);
  const what = result.lines ? `${result.kind} ${result.lang}, ${result.lines.length} lines, ${result.durationSec}s video` : result.reason;
  console.log(`[piqsy] captions ${videoId}: ${what}${result.detail ? ` (${result.detail})` : ''} in ${captionMs}ms${cached ? ' [cached]' : ''} [cookies ${cookieMode()}]`);
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
    cached,
    cookieMode: cookieMode(),
    verdict: null,
    windows: null,
    jevMs: null,
    totalMs: null,
    ranges: null,
    scores: null,
    jevError: null,
  };

  if (result.lines) {
    const windows = makeWindows(result.lines, result.durationSec);
    const t1 = performance.now();
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'score', query, texts: windows.map((w) => w.text) });
    } catch (e) {
      res = { error: String(e) }; // e.g. extension reloaded under an open tab
    }
    Object.assign(entry, { windows: windows.length, jevMs: ms(t1) });
    if (res.error) {
      Object.assign(entry, { verdict: 'error', jevError: res.error });
    } else {
      const { verdict, ranges } = judge(windows.map((w, i) => ({ ...w, score: res.scores[i] })));
      Object.assign(entry, { verdict, ranges, scores: res.scores.map((s) => Math.round(s * 1000) / 1000) });
    }
  }
  entry.totalMs = ms(t0);
  if (entry.verdict) {
    console.log(`[piqsy] verdict ${videoId}: ${entry.verdict}${entry.jevError ? ` (${entry.jevError})` : ''}, ${entry.windows} windows, Jev ${entry.jevMs}ms, total ${entry.totalMs}ms`);
  }
  try {
    await chrome.runtime.sendMessage({ type: 'log', entry });
  } catch (e) {
    console.warn('[piqsy] run log', e);
  }
  return entry.verdict || entry.outcome;
}

// YouTube re-renders results right after a search, dropping and re-adding
// chips; this de-duplicates so each (query, video) is evaluated once per tab.
// ponytail: in-memory per tab, like captionCache.
const evaluations = new Map(); // `${query}\n${videoId}` -> Promise<state>

function getEvaluation(query, videoId) {
  const key = `${query}\n${videoId}`;
  if (!evaluations.has(key)) {
    evaluations.set(
      key,
      evaluate(query, videoId)
        .catch((e) => (console.warn('[piqsy]', e), 'error'))
        .then((state) => {
          if (state === 'error') evaluations.delete(key); // retry next time
          return state;
        }),
    );
  }
  return evaluations.get(key);
}

async function check(chip) {
  const state = await getEvaluation(chip.dataset.query, chip.dataset.videoId);
  if (chip.isConnected) setState(chip, state);
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
  if (location.pathname !== '/results') return;
  const query = new URLSearchParams(location.search).get('search_query') || '';
  const results = topResults();
  const wanted = new Map(results.map(({ videoId, thumb }) => [thumb, videoId]));

  for (const chip of document.querySelectorAll('.piqsy-chip')) {
    const thumb = chip.parentElement;
    if (wanted.get(thumb) !== chip.dataset.videoId || chip.dataset.query !== query) chip.remove();
  }
  if (isStale(query, results.map((r) => r.videoId).join())) return;
  const t0 = performance.now();
  const checks = [];
  for (const [thumb, videoId] of wanted) {
    if (thumb.querySelector(':scope > .piqsy-chip')) continue;
    const chip = makeChip(videoId, query);
    thumb.append(chip);
    checks.push(check(chip));
  }
  if (checks.length) {
    Promise.all(checks).then(() => console.log(`[piqsy] ${checks.length} videos checked in parallel in ${Math.round(performance.now() - t0)}ms`));
  }
}

function safeSync() {
  try {
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
