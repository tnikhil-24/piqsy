// node --test
const test = require('node:test');
const assert = require('node:assert');
const { appendLog, LOG_KEY, LOG_MAX } = require('./runlog.js');

// Fake chrome.storage.local with async gaps, so unchained appends would clobber each other.
function fakeStorage(log) {
  let data = { [LOG_KEY]: log };
  const tick = () => new Promise((r) => setTimeout(r));
  return {
    get: async (k) => (await tick(), { [k]: structuredClone(data[k]) }),
    set: async (o) => (await tick(), (data = { ...data, ...o })),
    log: () => data[LOG_KEY],
  };
}

test('parallel appends all land, oldest dropped past the limit', async () => {
  const s = fakeStorage(Array.from({ length: LOG_MAX - 2 }, (_, i) => ({ i })));
  await Promise.all([1, 2, 3, 4, 5].map((n) => appendLog({ n }, s)));
  const log = s.log();
  assert.equal(log.length, LOG_MAX);
  assert.deepEqual(log.at(0), { i: 3 });
  assert.deepEqual(log.slice(-5).map((e) => e.n), [1, 2, 3, 4, 5]);
});
