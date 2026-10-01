// Saved captions, one storage key per video ("cap:<videoId>") plus a small
// index { videoId: savedAt } for evicting the oldest. Runs in the background
// worker only (single writer); writes are chained like the run log's.

const CAP_MAX_VIDEOS = 200;
// ponytail: very long videos (> ~3 h of speech) aren't saved, to keep storage
// small; slice 05's smaller caption format may make them cheap enough.
const CAP_MAX_LINES = 5000;

let capQueue = Promise.resolve();

function saveCaptions(videoId, result, storage = chrome.storage.local) {
  if (result.lines.length > CAP_MAX_LINES) return capQueue;
  const { playerMs, textMs, ...kept } = result; // timings belong to the original fetch
  capQueue = capQueue
    .then(async () => {
      const { capIndex = {} } = await storage.get('capIndex');
      capIndex[videoId] = Date.now();
      const oldest = Object.keys(capIndex)
        .sort((a, b) => capIndex[a] - capIndex[b])
        .slice(0, -CAP_MAX_VIDEOS);
      for (const id of oldest) delete capIndex[id];
      if (oldest.length) await storage.remove(oldest.map((id) => `cap:${id}`));
      await storage.set({ capIndex, [`cap:${videoId}`]: kept });
    })
    .catch((e) => console.warn('[piqsy] caption store', e));
  return capQueue;
}

async function loadCaptions(videoId, storage = chrome.storage.local) {
  const key = `cap:${videoId}`;
  return (await storage.get(key))[key] || null;
}

if (typeof module === 'object') module.exports = { saveCaptions, loadCaptions, CAP_MAX_VIDEOS, CAP_MAX_LINES };
