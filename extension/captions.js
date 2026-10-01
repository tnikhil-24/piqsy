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
//   localStorage.piqsyCookies = 2   cookies + the SAPISIDHASH header YouTube's own page sends
//   delete localStorage.piqsyCookies   back to no cookies (default)
function cookieMode() {
  try {
    return Number(localStorage.piqsyCookies) || 0;
  } catch {
    return 0;
  }
}

// YouTube's web auth header: SHA-1 of "<ts> <SAPISID> <origin>". Null when logged out.
async function sapisidHash() {
  const sapisid = document.cookie.match(/(?:^|; )(?:SAPISID|__Secure-3PAPISID)=([^;]+)/)?.[1];
  if (!sapisid) return null;
  const ts = Math.floor(Date.now() / 1000);
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`${ts} ${sapisid} ${location.origin}`));
  return `SAPISIDHASH ${ts}_${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function fetchCaptions(videoId) {
  try {
    const mode = cookieMode();
    // Default 'omit' so logged-in and logged-out behave the same.
    const credentials = mode ? 'include' : 'omit';
    const headers = { 'Content-Type': 'application/json' };
    const auth = mode === 2 && (await sapisidHash());
    if (auth) Object.assign(headers, { Authorization: auth, 'X-Origin': location.origin, 'X-Goog-AuthUser': '0' });
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      credentials,
      headers,
      body: JSON.stringify({ context: { client: PLAYER_CLIENT }, videoId }),
    });
    const player = await playerRes.json();
    if (player.error) return { reason: 'fetch failed', detail: `player HTTP ${playerRes.status}: ${player.error.status || ''} ${player.error.message || ''}` };
    const status = player.playabilityStatus?.status;
    if (status !== 'OK') return { reason: 'fetch failed', detail: `player ${status}: ${player.playabilityStatus?.reason || ''}` };

    const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) return { reason: 'none' };
    const track = pickTrack(tracks);
    if (!track) return { reason: 'not English', detail: tracks.map((t) => t.vssId).join(',') };

    const url = new URL(track.baseUrl);
    url.searchParams.set('fmt', 'json3');
    const res = await fetch(url, { credentials });
    const body = await res.text();
    if (!res.ok || !body) return { reason: 'fetch failed', detail: `timedtext HTTP ${res.status}, ${body.length} bytes` };

    return {
      lines: parseJson3(JSON.parse(body)),
      kind: track.kind === 'asr' ? 'auto' : 'manual',
      lang: track.languageCode,
      durationSec: Number(player.videoDetails?.lengthSeconds),
    };
  } catch (e) {
    return { reason: 'fetch failed', detail: String(e) };
  }
}

// ponytail: in-memory per tab, survives in-app navigation (refined searches) but not a reload.
// Move to chrome.storage.session in the background worker once it exists (Jev slice).
const captionCache = new Map(); // videoId -> Promise<result>

function getCaptions(videoId) {
  const cached = captionCache.has(videoId);
  if (!cached) {
    captionCache.set(
      videoId,
      fetchCaptions(videoId).then((r) => {
        if (r.reason === 'fetch failed') captionCache.delete(videoId); // retry next time
        return r;
      }),
    );
  }
  return captionCache.get(videoId).then((result) => ({ result, cached }));
}

if (typeof module === 'object') module.exports = { pickTrack, parseJson3 };
