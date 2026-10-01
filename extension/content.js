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

// Idempotent: YouTube recycles renderer elements across searches, so a chip
// stays only while its thumbnail still shows the same video for the same query.
function sync() {
  if (location.pathname !== '/results') return;
  const query = new URLSearchParams(location.search).get('search_query') || '';
  const wanted = new Map(topResults().map(({ videoId, thumb }) => [thumb, videoId]));

  for (const chip of document.querySelectorAll('.piqsy-chip')) {
    const thumb = chip.parentElement;
    if (wanted.get(thumb) !== chip.dataset.videoId || chip.dataset.query !== query) chip.remove();
  }
  for (const [thumb, videoId] of wanted) {
    if (!thumb.querySelector(':scope > .piqsy-chip')) thumb.append(makeChip(videoId, query));
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
