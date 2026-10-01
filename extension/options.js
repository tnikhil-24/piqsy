const LOG_KEY = 'runLog'; // same key as runlog.js
const $ = (id) => document.getElementById(id);

chrome.storage.local.get('jevKey').then(({ jevKey }) => ($('keyStatus').textContent = jevKey ? 'A key is saved.' : 'No key saved yet.'));

// Saves the key, then asks the background worker (the only Jev caller) to try it.
$('save').onclick = async () => {
  const key = $('key').value.trim();
  if (!key) return;
  await chrome.storage.local.set({ jevKey: key });
  $('key').value = '';
  $('keyStatus').textContent = 'Saved. Checking…';
  const res = await chrome.runtime.sendMessage({ type: 'checkKey', key });
  $('keyStatus').textContent = !res.error
    ? '✓ Saved. The key works.'
    : res.status === 401
      ? '✕ Saved, but Jev rejected this key (401). Check that you copied it fully.'
      : `! Saved, but the check failed: ${res.error}`;
};

async function readLog() {
  return (await chrome.storage.local.get(LOG_KEY))[LOG_KEY] || [];
}

readLog().then((log) => ($('count').textContent = `${log.length} entries stored on this computer.`));

$('export').onclick = async () => {
  const blob = new Blob([JSON.stringify(await readLog(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `piqsy-log-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
