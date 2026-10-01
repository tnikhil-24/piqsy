// node --test
const test = require('node:test');
const assert = require('node:assert');
const { judge } = require('./verdict.js');

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

test('one-window video', () => {
  assert.equal(verdict(0.9), 'partial');
});

test('ranges: runs >= 0.7, strongest 3 in time order, start 10 s early clamped at 0', () => {
  const { ranges } = judge(w(0.8, 0.75, 0.1, 0.72, 0.1, 0.95, 0.1, 0.71, 0.1));
  assert.deepEqual(ranges, [
    { start: 0, end: 240, peak: 0.8, strongest: false },
    { start: 350, end: 480, peak: 0.72, strongest: false },
    { start: 590, end: 720, peak: 0.95, strongest: true },
  ]);
});

test('no ranges when nothing reaches 0.7', () => {
  assert.deepEqual(judge(w(0.69, 0.5)).ranges, []);
});
