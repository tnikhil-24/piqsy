// Persistent local run log: one entry per evaluation, in chrome.storage.local
// (survives closing the browser, never leaves the machine). Exported as JSON
// from the options page.

const LOG_KEY = 'runLog';
const LOG_MAX = 2000; // ~300 bytes each, well under storage.local's 10 MB

let logQueue = Promise.resolve();

// Runs in the background worker only (the single writer for all tabs); appends
// are chained so parallel evaluations don't overwrite each other.
function appendLog(entry, storage = chrome.storage.local) {
  logQueue = logQueue
    .then(async () => {
      const { [LOG_KEY]: log = [] } = await storage.get(LOG_KEY);
      log.push(entry);
      await storage.set({ [LOG_KEY]: log.slice(-LOG_MAX) });
    })
    .catch((e) => console.warn('[piqsy] run log', e));
  return logQueue;
}

if (typeof module === 'object') module.exports = { appendLog, LOG_KEY, LOG_MAX };
