// Background service worker: the only place Jev is called, and the run log's
// single writer (so tabs can't overwrite each other's entries).
importScripts('jev.js', 'runlog.js');

const limit = makeLimiter(JEV_CONCURRENCY); // shared by all tabs and videos

async function handle(msg) {
  if (msg.type === 'log') return appendLog(msg.entry);
  if (msg.type === 'checkKey') {
    await askJev(msg.key, 'Piqsy key check.', { ok: { type: 'noul', instructions: 'This is a test.' } });
    return {};
  }
  if (msg.type === 'score') {
    const { jevKey } = await chrome.storage.local.get('jevKey');
    if (!jevKey) throw new Error('no Jev key: paste it in Piqsy options');
    return { scores: await scoreWindows(jevKey, msg.query, msg.texts, { limit }) };
  }
  throw new Error(`unknown message ${msg.type}`);
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  handle(msg).then(
    (r) => reply(r || {}),
    (e) => reply({ error: e.message, status: e.status }),
  );
  return true; // reply is async
});
