// node --test
const test = require('node:test');
const assert = require('node:assert');
const { scoreWindows, askJev, JEV_URL, JEV_RETRIES } = require('./jev.js');

const answer = (noul) => new Response(JSON.stringify({ answers: { explains: { type: 'noul', noul } } }));
const status = (code, headers) => new Response('nope', { status: code, headers });

// Fake fetch that replays responses in order and records requests.
function fakeFetch(...responses) {
  const calls = [];
  const f = async (url, init) => (calls.push({ url, init }), responses.shift());
  return { f, calls };
}
const noWait = () => {
  const waits = [];
  return { sleep: async (ms) => waits.push(ms), waits };
}

test('one noul request per non-empty window, probabilities in order', async () => {
  const { f, calls } = fakeFetch(answer(0.9), answer(0.2));
  const scores = await scoreWindows('k', 'b+ tree', ['first', '', 'third'], { fetch: f });
  assert.deepEqual(scores, [0.9, 0, 0.2]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, JEV_URL);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer k');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.state, 'first');
  assert.equal(body.questions.explains.type, 'noul');
  assert.match(body.questions.explains.instructions, /b\+ tree/);
});

test('retries 429 honouring Retry-After, and 529/5xx with exponential backoff', async () => {
  const { f } = fakeFetch(status(429, { 'retry-after': '2' }), status(529), status(503), answer(0.5));
  const { sleep, waits } = noWait();
  assert.deepEqual(await scoreWindows('k', 'q', ['t'], { fetch: f, sleep }), [0.5]);
  assert.deepEqual(waits, [2000, 1000, 2000]);
});

test('retry-after-ms wins over Retry-After', async () => {
  const { f } = fakeFetch(status(429, { 'retry-after-ms': '250', 'retry-after': '9' }), answer(0.5));
  const { sleep, waits } = noWait();
  await askJev('k', 's', {}, { fetch: f, sleep });
  assert.deepEqual(waits, [250]);
});

test('no retry on 401', async () => {
  const { f, calls } = fakeFetch(status(401), answer(0.5));
  await assert.rejects(askJev('k', 's', {}, { fetch: f, sleep: noWait().sleep }), { status: 401 });
  assert.equal(calls.length, 1);
});

test('gives up after JEV_RETRIES retries', async () => {
  const { f, calls } = fakeFetch(...Array.from({ length: 10 }, () => status(500)));
  await assert.rejects(askJev('k', 's', {}, { fetch: f, sleep: noWait().sleep }), { status: 500 });
  assert.equal(calls.length, JEV_RETRIES + 1);
});

test('network errors are retried too', async () => {
  let n = 0;
  const f = async () => (n++ ? answer(0.4) : Promise.reject(new TypeError('offline')));
  assert.deepEqual(await scoreWindows('k', 'q', ['t'], { fetch: f, sleep: noWait().sleep }), [0.4]);
});

test('concurrency limit is respected', async () => {
  const { makeLimiter } = require('./jev.js');
  let active = 0;
  let max = 0;
  const f = async () => {
    max = Math.max(max, ++active);
    await new Promise((r) => setTimeout(r, 5));
    active--;
    return answer(0.1);
  };
  await scoreWindows('k', 'q', Array(20).fill('t'), { fetch: f, limit: makeLimiter(3) });
  assert.equal(max, 3);
});
