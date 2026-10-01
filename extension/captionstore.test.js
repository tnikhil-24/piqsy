// node --test
const test = require('node:test');
const assert = require('node:assert');
const { saveCaptions, loadCaptions, CAP_MAX_VIDEOS, CAP_MAX_LINES } = require('./captionstore.js');

function fakeStorage() {
  const data = {};
  const tick = () => new Promise((r) => setTimeout(r));
  return {
    data,
    get: async (k) => (await tick(), { [k]: structuredClone(data[k]) }),
    set: async (o) => (await tick(), Object.assign(data, structuredClone(o))),
    remove: async (keys) => (await tick(), keys.forEach((k) => delete data[k])),
  };
}
const result = (n = 1) => ({ lines: Array.from({ length: n }, (_, i) => ({ start: i, duration: 1, text: 't' })), kind: 'auto', lang: 'en', durationSec: n, playerMs: 300, textMs: 200 });

test('saved captions come back for the same video only, without fetch timings', async () => {
  const s = fakeStorage();
  await saveCaptions('a', result(), s);
  const back = await loadCaptions('a', s);
  assert.equal(back.lines.length, 1);
  assert.equal(back.playerMs, undefined);
  assert.equal(await loadCaptions('b', s), null);
});

test('parallel saves past the limit keep the newest CAP_MAX_VIDEOS videos', async () => {
  const s = fakeStorage();
  const ids = Array.from({ length: CAP_MAX_VIDEOS + 3 }, (_, i) => `v${i}`);
  await Promise.all(ids.map((id) => saveCaptions(id, result(), s)));
  assert.equal(Object.keys(s.data.capIndex).length, CAP_MAX_VIDEOS);
  assert.equal(Object.keys(s.data).filter((k) => k.startsWith('cap:')).length, CAP_MAX_VIDEOS);
  assert.equal(await loadCaptions('v0', s), null);
  assert.ok(await loadCaptions(`v${CAP_MAX_VIDEOS + 2}`, s));
});

test('very long captions are not saved', async () => {
  const s = fakeStorage();
  await saveCaptions('long', result(CAP_MAX_LINES + 1), s);
  assert.equal(await loadCaptions('long', s), null);
});
