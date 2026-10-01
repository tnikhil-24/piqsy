// node --test
const test = require('node:test');
const assert = require('node:assert');
const { pickTrack, parseJson3, isBlock } = require('./captions.js');

const track = (vssId, languageCode, kind) => ({ vssId, languageCode, kind });

test('pickTrack prefers creator-written English over ASR', () => {
  const tracks = [track('a.en', 'en', 'asr'), track('.hi', 'hi'), track('.en-IN', 'en-IN')];
  assert.equal(pickTrack(tracks).vssId, '.en-IN');
});

test('pickTrack falls back to English ASR', () => {
  assert.equal(pickTrack([track('.hi', 'hi'), track('a.en', 'en', 'asr')]).vssId, 'a.en');
});

test('pickTrack returns nothing when no track is English', () => {
  assert.equal(pickTrack([track('a.hi', 'hi', 'asr'), track('.eo', 'eo')]), undefined);
});

test('parseJson3 joins segments, drops empty events, converts ms to s', () => {
  const json = {
    events: [
      { tStartMs: 0, dDurationMs: 5000 }, // window-style event, no segs
      { tStartMs: 719, dDurationMs: 4040, segs: [{ utf8: 'welcome' }, { utf8: ' to\nthe' }] },
      { tStartMs: 2669, dDurationMs: 10, aAppend: 1, segs: [{ utf8: '\n' }] },
      { tStartMs: 4759, segs: [{ utf8: 'course' }] },
    ],
  };
  assert.deepEqual(parseJson3(json), [
    { start: 0.719, duration: 4.04, text: 'welcome to the' },
    { start: 4.759, duration: 0, text: 'course' },
  ]);
});

test('isBlock: IP-level refusals only, not one unavailable video', () => {
  assert.ok(isBlock({ detail: 'timedtext HTTP 429, 1103 bytes' }));
  assert.ok(isBlock({ detail: 'player LOGIN_REQUIRED: Sign in to confirm you’re not a bot' }));
  assert.ok(!isBlock({ detail: 'player LOGIN_REQUIRED: Sign in to confirm your age' }));
  assert.ok(!isBlock({ detail: 'paused after a YouTube block until 3:00:00 PM' }));
  assert.ok(!isBlock({ reason: 'none' }));
});
