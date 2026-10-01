// node --test
const test = require('node:test');
const assert = require('node:assert');
const { makeWindows, MAX_WINDOWS } = require('./windows.js');

const line = (start, text) => ({ start, duration: 2, text });

test('a 5-minute video gets 2-minute windows tiling the whole video', () => {
  const w = makeWindows([line(0, 'a'), line(119, 'b'), line(120, 'c'), line(299, 'd')], 300);
  assert.deepEqual(w, [
    { start: 0, end: 120, text: 'a b' },
    { start: 120, end: 240, text: 'c' },
    { start: 240, end: 300, text: 'd' },
  ]);
});

test('caption gaps leave empty windows so time adjacency is kept', () => {
  const w = makeWindows([line(10, 'a'), line(400, 'b')], 480);
  assert.deepEqual(w.map((x) => x.text), ['a', '', '', 'b']);
});

test('a 24-hour video is capped at MAX_WINDOWS', () => {
  const w = makeWindows([line(0, 'a'), line(86399, 'z')], 86400);
  assert.ok(w.length <= MAX_WINDOWS);
  assert.equal(w.at(-1).end, 86400);
  assert.equal(w.at(-1).text, 'z');
});

test('missing duration falls back to the last caption line', () => {
  const w = makeWindows([line(0, 'a'), line(200, 'b')], NaN);
  assert.equal(w.at(-1).end, 202);
});
