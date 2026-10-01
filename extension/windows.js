// Windowing: caption lines + duration -> windows [{ start, end, text }] that
// tile the whole video. Empty windows (silence, caption gaps) keep text ''.

const WINDOW_SEC = 120;
const MAX_WINDOWS = 60;

// ponytail: long videos just get wider windows (<= MAX_WINDOWS); slice 05 adds
// the 2-minute second pass inside the best window.
function makeWindows(lines, durationSec) {
  const last = lines.at(-1);
  const end = durationSec || (last ? last.start + last.duration : 0);
  const size = Math.max(WINDOW_SEC, Math.ceil(end / MAX_WINDOWS));
  const windows = [];
  for (let start = 0; start < end; start += size) {
    windows.push({ start, end: Math.min(start + size, end), text: [] });
  }
  for (const line of lines) {
    const w = windows[Math.min(Math.floor(line.start / size), windows.length - 1)];
    w?.text.push(line.text);
  }
  return windows.map((w) => ({ ...w, text: w.text.join(' ') }));
}

if (typeof module === 'object') module.exports = { makeWindows, WINDOW_SEC, MAX_WINDOWS };
