// Windowing: caption lines + duration -> windows [{ start, end, text }] that
// tile the whole video. Empty windows (silence, caption gaps) keep text ''.

const WINDOW_SEC = 120;
const MAX_WINDOWS = 60;

// ponytail: long videos just get wider windows (<= MAX_WINDOWS); slice 05 adds
// the 2-minute second pass inside the best window.
function makeWindows(lines, durationSec) {
  const last = lines.at(-1);
  const end = durationSec || (last ? last.start + last.duration : 0);
  if (!end) return [];
  const size = Math.max(WINDOW_SEC, Math.ceil(end / MAX_WINDOWS));
  // A leftover under half a window joins the last one (a 2:10 video is one window).
  const n = Math.max(1, Math.round(end / size));
  const windows = Array.from({ length: n }, (_, i) => ({ start: i * size, end: i === n - 1 ? end : (i + 1) * size, text: [] }));
  for (const line of lines) windows[Math.min(Math.floor(line.start / size), n - 1)].text.push(line.text);
  return windows.map((w) => ({ ...w, text: w.text.join(' ') }));
}

if (typeof module === 'object') module.exports = { makeWindows, WINDOW_SEC, MAX_WINDOWS };
