// node --test
const test = require('node:test');
const assert = require('node:assert');
const { makeWindows, fineWindows, MAX_WINDOWS, WINDOW_SEC } = require('./windows.js');

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

test('a short leftover joins the last window, so a 2:10 video is one window', () => {
  assert.deepEqual(makeWindows([line(0, 'a'), line(125, 'b')], 130), [{ start: 0, end: 130, text: 'a b' }]);
});

test('missing duration falls back to the last caption line', () => {
  const w = makeWindows([line(0, 'a'), line(200, 'b')], NaN);
  assert.equal(w.at(-1).end, 202);
});

test('2-hour boundary: 2-minute windows up to 2 h, wider just past it', () => {
  const at = makeWindows([line(0, 'a')], 7200);
  assert.equal(at.length, MAX_WINDOWS);
  assert.ok(at.every((x) => x.end - x.start === WINDOW_SEC));
  const past = makeWindows([line(0, 'a')], 7260);
  assert.ok(past.length <= MAX_WINDOWS);
  assert.equal(past[0].end, 121);
});

test('a 24-hour video with captions only at the ends still tiles with empty middles', () => {
  const w = makeWindows([line(5, 'a'), line(86390, 'z')], 86400);
  assert.equal(w.length, MAX_WINDOWS);
  assert.equal(w[0].end, 1440);
  assert.equal(w.filter((x) => x.text).length, 2);
});

test('fineWindows: 2-minute windows inside a wide window, only its own lines, gaps empty', () => {
  const lines = [line(1400, 'before'), line(1450, 'a'), line(1700, 'b'), line(2880, 'after')];
  const f = fineWindows(lines, { start: 1440, end: 2880 });
  assert.equal(f.length, 12);
  assert.equal(f[0].start, 1440);
  assert.equal(f.at(-1).end, 2880);
  assert.deepEqual(f.map((x) => x.text).filter(Boolean), ['a', 'b']);
  assert.equal(f[2].text, 'b');
});
