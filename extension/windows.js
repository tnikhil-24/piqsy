// Windowing: caption lines + duration -> windows [{ start, end, text }] that
// tile the whole video. Empty windows (silence, caption gaps) keep text ''.

const WINDOW_SEC = 120;
const MAX_WINDOWS = 60;

// Windows of about `size` seconds tiling [start, end]. A leftover under half a
// window joins the last one (a 2:10 video is one window).
function tile(lines, start, end, size) {
  const n = Math.max(1, Math.round((end - start) / size));
  const windows = Array.from({ length: n }, (_, i) => ({ start: start + i * size, end: i === n - 1 ? end : start + (i + 1) * size, text: [] }));
  for (const line of lines) windows[Math.min(Math.floor((line.start - start) / size), n - 1)].text.push(line.text);
  return windows.map((w) => ({ ...w, text: w.text.join(' ') }));
}

// First pass: videos over 2 h get wider windows, so at most MAX_WINDOWS.
function makeWindows(lines, durationSec) {
  const last = lines.at(-1);
  const end = durationSec || (last ? last.start + last.duration : 0);
  if (!end) return [];
  return tile(lines, 0, end, Math.max(WINDOW_SEC, Math.ceil(end / MAX_WINDOWS)));
}

// Second pass: 2-minute windows inside one wide window { start, end }.
function fineWindows(lines, { start, end }) {
  return tile(lines.filter((l) => l.start >= start && l.start < end), start, end, WINDOW_SEC);
}

if (typeof module === 'object') module.exports = { makeWindows, fineWindows, WINDOW_SEC, MAX_WINDOWS };
