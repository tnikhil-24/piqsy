// Background service worker: the only place Jev is called, and the single
// writer of the run log and saved captions (so tabs can't overwrite each other).
importScripts('jev.js', 'runlog.js', 'captionstore.js');

const limit = makeLimiter(JEV_CONCURRENCY); // shared by all tabs and videos

async function jevKey() {
  const { jevKey } = await chrome.storage.local.get('jevKey');
  if (!jevKey) throw new Error('no Jev key: paste it in Piqsy options');
  return jevKey;
}

async function handle(msg) {
  if (msg.type === 'log') return appendLog(msg.entry);
  if (msg.type === 'saveCaptions') return saveCaptions(msg.videoId, msg.result);
  if (msg.type === 'loadCaptions') return { result: await loadCaptions(msg.videoId) };
  // Ratings for the watch-page strip: chrome.storage.session lasts until the browser
  // closes and is shared by tabs, so a result opened in a new tab still finds it.
  if (msg.type === 'rated') return chrome.storage.session.set({ [`rated:${msg.videoId}`]: msg.rating });
  if (msg.type === 'rating') return { rating: (await chrome.storage.session.get(`rated:${msg.videoId}`))[`rated:${msg.videoId}`] ?? null };
  if (msg.type === 'checkKey') {
    await askJev(msg.key, 'Piqsy key check.', { ok: { type: 'noul', instructions: 'This is a test.' } });
    return {};
  }
  if (msg.type === 'score') return { scores: await scoreWindows(await jevKey(), msg.query, msg.texts, { broad: msg.broad, limit }) };
  if (msg.type === 'checkQuery') return checkQuery(await jevKey(), msg.query);
  throw new Error(`unknown message ${msg.type}`);
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  handle(msg).then(
    (r) => reply(r || {}),
    (e) => reply({ error: e.message, status: e.status }),
  );
  return true; // reply is async
});
