const LOG_KEY = 'runLog'; // same key as runlog.js

async function readLog() {
  return (await chrome.storage.local.get(LOG_KEY))[LOG_KEY] || [];
}

readLog().then((log) => (document.getElementById('count').textContent = `${log.length} entries stored on this computer.`));

document.getElementById('export').onclick = async () => {
  const blob = new Blob([JSON.stringify(await readLog(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `piqsy-log-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
