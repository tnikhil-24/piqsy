// Caption fetcher: videoId -> { lines: [{ start, duration, text }], kind, lang, durationSec } | { reason, detail }.
// Mechanism and why: docs/captions-spike.md. In short, the WEB client's caption
// URLs need a proof-of-origin token; the ANDROID client's don't.

// ponytail: pinned client version; if YouTube starts rejecting it, bump it (see the spike doc).
const PLAYER_CLIENT = { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, osName: 'Android', osVersion: '11', hl: 'en' };

const isEnglish = (t) => t.languageCode === 'en' || t.languageCode.startsWith('en-');

// Creator-written English first, then English ASR. Auto-translated tracks are
// never requested (no &tlang=), so they can't be picked.
function pickTrack(tracks) {
  const en = tracks.filter(isEnglish);
  return en.find((t) => t.kind !== 'asr') || en[0];
}

function parseJson3(json) {
  const lines = [];
  for (const e of json.events || []) {
    const text = (e.segs || []).map((s) => s.utf8).join('').replace(/\s+/g, ' ').trim();
    if (text) lines.push({ start: e.tStartMs / 1000, duration: (e.dDurationMs || 0) / 1000, text });
  }
  return lines;
}

// Experiment (issue 10, option 1), set in the YouTube tab's console, then reload:
//   localStorage.piqsyCookies = 1   send the user's YouTube cookies
//   delete localStorage.piqsyCookies   back to no cookies (default)
// (Mode 2, cookies + the web SAPISIDHASH header, got HTTP 400 with the ANDROID client; removed.)
function cookieMode() {
  try {
    return Number(localStorage.piqsyCookies) || 0;
  } catch {
    return 0;
  }
}

// A block is YouTube refusing this IP (CONTEXT.md), not one video being
// unavailable: "confirm you're not a bot" is a block, "confirm your age" is not.
const isBlock = (result) => /HTTP 429|not a bot/i.test(result.detail || '');

// After a block, no caption requests for PAUSE_MS: more requests only prolong
// it. Kept in YouTube's localStorage so all tabs and reloads share it; to test
// during a pause, `delete localStorage.piqsyPausedUntil` in the console.
const PAUSE_MS = 30 * 60 * 1000; // the hotspot's bot check lifted in < 25 min (issue 10)

function pausedUntil() {
  try {
    return Number(localStorage.piqsyPausedUntil) || 0;
  } catch {
    return 0;
  }
}

async function fetchCaptions(videoId) {
  const until = pausedUntil();
  if (Date.now() < until) return { reason: 'fetch failed', detail: `paused after a YouTube block until ${new Date(until).toLocaleTimeString()}` };
  const t0 = performance.now();
  const timings = {}; // playerMs, textMs: which request stalls (issue 10)
  try {
    const mode = cookieMode();
    // Default 'omit' so logged-in and logged-out behave the same.
    const credentials = mode ? 'include' : 'omit';
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: PLAYER_CLIENT }, videoId }),
    });
    const player = await playerRes.json();
    timings.playerMs = Math.round(performance.now() - t0);
    if (player.error) return { reason: 'fetch failed', detail: `player HTTP ${playerRes.status}: ${player.error.status || ''} ${player.error.message || ''}`, ...timings };
    const status = player.playabilityStatus?.status;
    if (status !== 'OK') return { reason: 'fetch failed', detail: `player ${status}: ${player.playabilityStatus?.reason || ''}`, ...timings };

    const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) return { reason: 'none', ...timings };
    const track = pickTrack(tracks);
    if (!track) return { reason: 'not English', detail: tracks.map((t) => t.vssId).join(','), ...timings };

    const url = new URL(track.baseUrl);
    url.searchParams.set('fmt', 'json3');
    const res = await fetch(url, { credentials });
    const body = await res.text();
    timings.textMs = Math.round(performance.now() - t0) - timings.playerMs;
    if (!res.ok || !body) return { reason: 'fetch failed', detail: `timedtext HTTP ${res.status}, ${body.length} bytes`, ...timings };

    return {
      lines: parseJson3(JSON.parse(body)),
      kind: track.kind === 'asr' ? 'auto' : 'manual',
      lang: track.languageCode,
      durationSec: Number(player.videoDetails?.lengthSeconds),
      ...timings,
    };
  } catch (e) {
    return { reason: 'fetch failed', detail: String(e), ...timings };
  }
}

// Saved captions (background worker, per video, survives reloads) first, then
// YouTube. Only results with captions are saved: "none" can change once
// YouTube generates auto captions for a fresh upload.
async function loadOrFetch(videoId) {
  const saved = await chrome.runtime.sendMessage({ type: 'loadCaptions', videoId }).catch(() => null);
  if (saved?.result) return { result: saved.result, cached: true };
  const result = await fetchCaptions(videoId);
  if (isBlock(result)) {
    localStorage.piqsyPausedUntil = Date.now() + PAUSE_MS;
    console.warn(`[piqsy] YouTube block (${result.detail}); no caption requests for ${PAUSE_MS / 60000} min`);
  }
  if (result.lines) chrome.runtime.sendMessage({ type: 'saveCaptions', videoId, result }).catch(() => {});
  return { result, cached: false };
}

// In-memory per tab on top: de-duplicates in-flight fetches for re-rendered chips.
const captionCache = new Map(); // videoId -> Promise<{ result, cached }>

function getCaptions(videoId) {
  const inMemory = captionCache.has(videoId);
  if (!inMemory) {
    captionCache.set(
      videoId,
      loadOrFetch(videoId).then((r) => {
        if (r.result.reason === 'fetch failed') captionCache.delete(videoId); // retry next time
        return r;
      }),
    );
  }
  return captionCache.get(videoId).then((r) => (inMemory ? { ...r, cached: true } : r));
}

if (typeof module === 'object') module.exports = { pickTrack, parseJson3, isBlock };
