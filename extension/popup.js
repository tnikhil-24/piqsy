// On/off switch. Stored as `enabled` (missing = on); content.js listens for changes.
const box = document.getElementById('enabled');
chrome.storage.local.get('enabled').then(({ enabled }) => (box.checked = enabled !== false));
box.onchange = () => chrome.storage.local.set({ enabled: box.checked });
