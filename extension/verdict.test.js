// node --test
const test = require('node:test');
const assert = require('node:assert');
const { judge, refine } = require('./verdict.js');

// scores -> 2-minute windows from 0
const w = (...scores) => scores.map((score, i) => ({ start: i * 120, end: (i + 1) * 120, score }));
const verdict = (...s) => judge(w(...s)).verdict;

test('Great needs a strong window next to a supporting one', () => {
  assert.equal(verdict(0.1, 0.85, 0.7, 0.1), 'great');
  assert.equal(verdict(0.7, 0.9), 'great');
});

test('a lone strong window is only Partial (false Great is the worst error)', () => {
  assert.equal(verdict(0.1, 0.95, 0.69, 0.1), 'partial');
});

test('verdict boundaries', () => {
  assert.equal(verdict(0.6, 0.1), 'partial');
  assert.equal(verdict(0.59, 0.1), 'unsure');
  assert.equal(verdict(0.3, 0.1), 'unsure');
  assert.equal(verdict(0.29, 0.1), 'not-covered');
  assert.equal(verdict(), 'unsure');
});

test('a short one-window video can be Great on its own score', () => {
  assert.equal(verdict(0.9), 'great');
  assert.equal(verdict(0.84), 'partial');
});

test('ranges: runs >= 0.7, strongest 3 in time order, start 10 s early clamped at 0', () => {
  const { ranges } = judge(w(0.8, 0.75, 0.1, 0.72, 0.1, 0.95, 0.1, 0.71, 0.1, 0.1, 0.1, 0.1, 0.1));
  assert.deepEqual(ranges, [
    { start: 0, end: 240, peak: 0.8, strongest: false },
    { start: 350, end: 480, peak: 0.72, strongest: false },
    { start: 590, end: 720, peak: 0.95, strongest: true },
  ]);
});

test('no ranges when nothing reaches 0.7', () => {
  assert.deepEqual(judge(w(0.69, 0.5)).ranges, []);
});

test('relevant throughout at 40% of the video: no ranges', () => {
  const at = judge(w(0.9, 0.8, 0.1, 0.1, 0.1)); // 240 of 600 s
  assert.equal(at.throughout, true);
  assert.deepEqual(at.ranges, []);
  const below = judge([...w(0.9, 0.8, 0.1, 0.1), { start: 480, end: 601, score: 0.1 }]); // 240 of 601 s
  assert.equal(below.throughout, false);
  assert.equal(below.ranges.length, 1);
});

test('bestWindow is the highest-scoring window', () => {
  const ws = w(0.2, 0.9, 0.95, 0.1);
  assert.equal(judge(ws).bestWindow, ws[2]);
  assert.equal(judge([]).bestWindow, null);
});

test('refine: fine 2-minute windows inside the best wide window set the range', () => {
  const ws = [0.1, 0.9, 0.1, 0.1, 0.1].map((score, i) => ({ start: i * 1440, end: (i + 1) * 1440, score }));
  const fine = [0.2, 0.75, 0.88, 0.3].map((score, i) => ({ start: 1440 + i * 120, end: 1440 + (i + 1) * 120, score }));
  assert.deepEqual(refine(ws, ws[1], fine), [{ start: 1550, end: 1800, peak: 0.9, strongest: true }]);
});

test('refine: the refined best range is not pushed out by weaker coarse ranges', () => {
  // Owner check pkYVOmU3MgA: best 0.78 refined to fine 0.72 lost to three coarse 0.72-0.74 ranges.
  const ws = [0.74, 0.1, 0.74, 0.1, 0.72, 0.1, 0.78].map((score, i) => ({ start: i * 720, end: (i + 1) * 720, score }));
  const fine = [0.3, 0.72, 0.5, 0.2, 0.1, 0.1].map((score, i) => ({ start: 4320 + i * 120, end: 4320 + (i + 1) * 120, score }));
  const ranges = refine(ws, ws[6], fine);
  assert.equal(ranges.length, 3);
  assert.deepEqual(ranges.find((r) => r.strongest), { start: 4430, end: 4560, peak: 0.78, strongest: true });
});

test('refine keeps the wide window when no fine window reaches the range threshold', () => {
  const ws = w(0.1, 0.9, 0.1);
  assert.deepEqual(refine(ws, ws[1], [{ start: 120, end: 180, score: 0.5 }, { start: 180, end: 240, score: 0.6 }]), [
    { start: 110, end: 240, peak: 0.9, strongest: true },
  ]);
});

test('broad: Great when relevant windows cover BROAD_GREAT_SHARE of the video, no ranges', () => {
  const { BROAD_GREAT_SHARE } = require('./verdict.js');
  assert.equal(BROAD_GREAT_SHARE, 0.4);
  // 2 of 5 equal windows relevant = 40%, though none reaches GREAT_PEAK
  const r = judge(w(0.75, 0.1, 0.72, 0.2, 0.1), 'broad');
  assert.deepEqual([r.verdict, r.throughout, r.ranges], ['great', true, []]);
  // same scores, narrow: no strong window, so only Partial
  assert.equal(judge(w(0.75, 0.1, 0.72, 0.2, 0.1)).verdict, 'partial');
});

test('broad: Partial below the coverage share, with ranges; Not covered and Unsure as narrow', () => {
  // 1 of 3 windows relevant = 33%; a narrow Great pattern is only Partial when broad
  const r = judge(w(0.95, 0.1, 0.1), 'broad');
  assert.equal(r.verdict, 'partial');
  assert.equal(r.ranges.length, 1);
  assert.equal(judge(w(0.9, 0.85, 0.1, 0.1, 0.1, 0.1), 'broad').verdict, 'partial');
  assert.equal(judge(w(0.29, 0.1), 'broad').verdict, 'not-covered');
  assert.equal(judge(w(0.59, 0.1), 'broad').verdict, 'unsure');
  assert.equal(judge([], 'broad').verdict, 'unsure');
});
