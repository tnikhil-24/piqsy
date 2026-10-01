// Jev client (background worker only; Jev's CORS blocks normal pages). API: docs/jev.md.

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
const JEV_CONCURRENCY = 8; // ~300 ms each -> ~27 req/s, under the documented 40 req/s
const JEV_RETRIES = 3;
const JEV_BACKOFF_MS = 500;

class JevError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status; // 0 = network
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function retryDelay(res, attempt) {
  const h = res?.headers;
  return Number(h?.get('retry-after-ms')) || Number(h?.get('retry-after')) * 1000 || JEV_BACKOFF_MS * 2 ** attempt;
}

// One request. Retries 429/529/5xx and network errors with backoff; 401/422 fail at once.
async function askJev(key, state, questions, { fetch: f = fetch, sleep: wait = sleep } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await f(JEV_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: JEV_MODEL, state, questions }),
      });
    } catch (e) {
      if (attempt >= JEV_RETRIES) throw new JevError(0, `Jev network error: ${e.message}`);
      await wait(retryDelay(null, attempt));
      continue;
    }
    if (res.ok) return (await res.json()).answers;
    if ((res.status !== 429 && res.status < 500) || attempt >= JEV_RETRIES) {
      const why = res.status === 401 ? ' (invalid key)' : '';
      throw new JevError(res.status, `Jev HTTP ${res.status}${why}: ${(await res.text()).slice(0, 200)}`);
    }
    await wait(retryDelay(res, attempt));
  }
}

function makeLimiter(n) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= n || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };
  return (fn) => new Promise((resolve, reject) => (queue.push({ fn, resolve, reject }), next()));
}

// Words that describe the video, not the topic (ADR 0005). Longest first.
const FORMAT_WORDS = ['full course', 'crash course', 'in one video', 'for beginners', 'tutorial', 'explained'];

// Query -> { topic, formatWords }: the query with format words removed (the
// original query if nothing is left), and the format words found. Pure.
function topicOf(query) {
  const formatWords = [];
  let topic = query;
  for (const w of FORMAT_WORDS) {
    const re = new RegExp(`\\b${w}s?\\b`, 'gi');
    if (re.test(topic)) formatWords.push(w);
    topic = topic.replace(re, ' ');
  }
  topic = topic.replace(/\s+/g, ' ').replace(/^[\s\-–—|:,]+|[\s\-–—|:,]+$/g, '');
  return { topic: topic || query, formatWords };
}

// Query check thresholds (first guesses; the benchmark, slice 09, tunes them).
const LEARNING_MIN = 0.5; // below: not a learning query, no chips
const BROAD_MIN = 0.65; // 0.5 plus a margin: near 0.5 is unsure, and unsure -> narrow (the stricter rule)

// One request, two noul questions: is this a learning query, and is it broad?
// Format words go to the broad question as a hint.
async function checkQuery(key, query, opts) {
  const { topic, formatWords } = topicOf(query);
  const hint = formatWords.length ? ` Format words in the search: ${formatWords.map((w) => `"${w}"`).join(', ')}.` : '';
  const questions = {
    learning: { type: 'noul', instructions: 'This YouTube search is to learn a concept or skill (not music, entertainment, news or shopping).' },
    broad: { type: 'noul', instructions: `This YouTube search asks for a whole subject, not one specific concept.${hint}` },
  };
  const a = await askJev(key, `YouTube search: "${query}"`, questions, opts);
  const learningP = a.learning.noul;
  const broadP = a.broad.noul;
  return { learningP, broadP, learning: learningP >= LEARNING_MIN, broad: broadP >= BROAD_MIN, topic, formatWords };
}

// Window texts -> probability each explains the query's topic (narrow) or
// teaches part of it (broad). One noul request per non-empty window; empty
// windows score 0 without a request.
function scoreWindows(key, query, texts, { broad = false, limit = makeLimiter(JEV_CONCURRENCY), ...opts } = {}) {
  const { topic } = topicOf(query);
  const instructions = broad ? `This transcript excerpt teaches part of "${topic}".` : `This transcript excerpt explains "${topic}".`;
  const questions = { explains: { type: 'noul', instructions } };
  return Promise.all(texts.map((text) => (text ? limit(async () => (await askJev(key, text, questions, opts)).explains.noul) : 0)));
}

if (typeof module === 'object') module.exports = { askJev, scoreWindows, checkQuery, topicOf, LEARNING_MIN, BROAD_MIN, makeLimiter, JevError, JEV_URL, JEV_RETRIES };
