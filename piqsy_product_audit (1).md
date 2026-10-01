# Piqsy — Full Product & Technical Audit

**Status:** Prototype / validation stage  
**Working name:** Piqsy  
**Product category:** Educational video discovery, search-result intelligence, and learning-content matching  
**Initial surface:** Chrome extension for YouTube search  
**Long-term surfaces:** Web search platform, learning-path platform, mobile/desktop applications  

---

## 1. Executive Summary

Piqsy addresses a simple but persistent problem: when someone searches YouTube to learn a technical concept, the search results often look equally plausible. The user may open several videos, sit through introductions, scrub timelines, and discover that a video is too basic, too advanced, outdated, or does not actually cover the concept they searched for.

Piqsy's initial product promise is:

> **Know which video actually answers your question before you click it.**

On a YouTube search page, Piqsy adds a compact verdict to results such as:

- `✓ Great · starts 2:40`
- `◐ Partial · starts 11:20`
- `✕ Skip`
- `? Unsure`

The verdict is relative to the user's **search intent and selected learning level**, rather than being a universal rating of the video.

The initial Chrome extension is not intended to be the entire product. It is the first interface and distribution wedge for a larger **content-matching engine** that maps a learner's intent to the most relevant educational video or exact video segment.

The project is worth pursuing if two core assumptions survive early testing:

1. Timestamped YouTube captions can be obtained from the user's browser with sufficient reliability and acceptable platform/policy risk.
2. Jev, with an LLM fallback where necessary, can identify highly relevant videos with sufficiently high precision that users learn to trust `Great` recommendations.

Piqsy should therefore be developed as a **validation-first product**, not as a large startup build from day one.

---

## 2. The User Problem

A typical learning search looks like:

> `how does kafka consumer group rebalancing work`

YouTube may return 15–20 apparently relevant videos. Titles and thumbnails do not reliably answer:

- Does this video actually explain rebalancing?
- Does it cover the concept deeply enough?
- Is it appropriate for a beginner, intermediate, or advanced learner?
- Is it primarily conceptual, code-along, lecture, interview prep, or something else?
- Is important information outdated?
- Is the relevant material buried inside a long course?
- Where does the useful explanation actually begin?

The current workflow is often:

`Search → Click → Intro → Scrub → Wrong video → Back → Repeat`

Piqsy aims to make it:

`Search → Compare fit → Click the right video at the right timestamp`

This is a meaningful distinction from generic video summarization.

---

## 3. Product Thesis

Piqsy should not position itself as:

> "AI that summarizes YouTube videos."

That category is crowded and easy to replicate.

The stronger thesis is:

> **Piqsy matches learning intent to educational content before the user spends time watching it.**

The fundamental primitive is therefore:

`USER INTENT ↔ CONTENT SEGMENT`

rather than:

`VIDEO → SUMMARY`

This distinction should guide product design, data architecture, evaluation, branding, and future expansion.

---

## 4. Target Users

### Initial audience

CS and engineering students and early-career professionals using YouTube to learn topics such as:

- Programming languages
- Data structures and algorithms
- Databases
- Operating systems
- Computer networks
- Distributed systems
- Cloud engineering
- System design
- Machine learning and AI
- Mathematics
- Electronics and engineering concepts

### Future audience

The matching engine can eventually expand into other educational domains where users search for explanatory video content.

### User-selected level

The initial version should allow the learner to select:

- Beginner
- Intermediate
- Advanced

The same video can therefore receive different recommendations depending on the learner.

---

## 5. Initial User Experience

When a YouTube search page loads:

1. Piqsy detects visible video results.
2. Every result immediately receives a faint `Pending` state.
3. Metadata is evaluated quickly for visible results.
4. A preliminary badge appears.
5. Approximately the top five uncached results receive deeper caption-based analysis.
6. Those badges upgrade in place when the deeper result arrives.

Example:

```text
Kafka Consumer Groups Explained
✓ GREAT · starts 4:18
Intermediate · Diagram explanation
```

Hovering or expanding the badge could show:

```text
Why Great?

✓ Consumer groups
✓ Rebalancing
✓ Partition assignment
✓ Consumer failure handling

Level: Intermediate
Format: Conceptual / diagrams
Source: Captions checked
Best section starts around 4:18
```

The UI should make the difference between **metadata-only** and **caption-verified** judgments visible so users understand the confidence/provenance of the recommendation.

---

## 6. Verdict Model

Piqsy should avoid pretending certainty where none exists.

Recommended states:

### ✓ Great
The video substantially satisfies the user's intent at an appropriate level.

### ◐ Partial
The video contains useful material but does not sufficiently cover the complete intent.

### ✕ Skip
The video does not materially satisfy the user's request or is clearly inappropriate for the requested learning need.

### ? Unsure
The available evidence is insufficient or the evaluator lacks enough confidence to make a reliable recommendation.

The `Unsure` state is important. A false `Great` damages trust much more than admitting uncertainty.

---

## 7. The Critical Caching Correction

A video cannot have one universal verdict.

Consider a single video titled **Complete Database Indexing Explained**.

| Search | Possible result |
|---|---|
| database indexing | Great |
| B+ trees | Great · starts 18:40 |
| B+ tree insertion | Partial · starts 25:10 |
| hash index vs B-tree | Partial · starts 31:20 |
| LSM trees | Skip |
| clustered index | Great · starts 9:10 |

Therefore this cache is conceptually wrong:

```text
video_123 → Great → starts 9:10
```

The recommendation is a function of:

`Video × Search Intent × User Level`

Piqsy should use two related caching layers.

### Layer 1 — Video knowledge

Reusable information about the content itself:

```json
{
  "videoId": "abc123",
  "segments": [
    {
      "start": 65,
      "end": 280,
      "topics": ["database indexes", "lookup complexity"]
    },
    {
      "start": 540,
      "end": 1100,
      "topics": ["B-tree", "B+ tree"]
    }
  ],
  "level": "intermediate",
  "format": "lecture"
}
```

The raw transcript does not need to be permanently stored if Piqsy can retain a sufficiently useful structured representation.

### Layer 2 — Query fit

Evaluate:

`normalized intent + user level + video knowledge`

and cache something like:

```json
{
  "fit": "great",
  "confidence": 0.94,
  "start": 548,
  "coverage": ["consumer groups", "rebalancing"]
}
```

A conceptual cache key could resemble:

`video_id + normalized_intent + user_level + evaluator_version`

---

## 8. Intent Normalization

Literal searches frequently express the same underlying intent:

- `how does kafka consumer groups work`
- `kafka consumer group explained`
- `explain consumer groups kafka`
- `what is consumer group in kafka`

These can potentially normalize toward something like:

```text
topic: kafka consumer groups
intent: conceptual explanation
level: intermediate
```

This reduces duplicate evaluations and increases shared-cache effectiveness.

Intent normalization should be validated carefully rather than aggressively collapsing queries that differ in important ways.

---

## 9. Jev's Role

Jev is well suited to the **bounded decision** portion of Piqsy.

Instead of requesting long generated analyses, Piqsy can ask structured questions such as:

### Coverage

```text
FULL
PARTIAL
INCIDENTAL
NONE
```

### Level

```text
BEGINNER
INTERMEDIATE
ADVANCED
```

### Format

```text
CONCEPTUAL
TUTORIAL
LECTURE
CODE_ALONG
INTERVIEW
OTHER
```

### Freshness concern

```text
YES
NO
UNSURE
```

### Fit verdict

```text
GREAT
PARTIAL
SKIP
UNSURE
```

Jev should be the primary evaluator where the task can be expressed reliably as structured choices.

An LLM should remain a fallback rather than silently becoming the primary intelligence layer.

---

## 10. LLM Fallback Strategy

Fallback should be explicit and measurable.

Example decision flow:

```text
if Jev confidence >= threshold:
    use Jev result
elif transcript available and richer Jev pass may help:
    retry structured evaluation
elif ambiguity is important and fallback budget allows:
    use LLM
else:
    return Unsure
```

Metrics should track:

- Percentage resolved by metadata Jev
- Percentage resolved by transcript Jev
- Percentage requiring LLM fallback
- Percentage ending as `Unsure`
- Accuracy of each path
- Cost of each path

If most difficult cases quietly move to an LLM, Piqsy's cost and architecture assumptions change significantly.

---

## 11. Caption Strategy

Current proposed flow:

1. The extension operates inside the user's YouTube browser session.
2. It retrieves YouTube's available captions for selected videos.
3. Approximately the top five uncached results receive transcript-based analysis.
4. Transcript text is sent temporarily to the backend.
5. The backend evaluates it.
6. Raw transcript content is deleted/not intentionally persisted.
7. Structured knowledge and verdicts are cached.

This architecture is attractive because server-side caption retrieval can be unreliable, while the browser already has the context needed to display captions.

However, caption acquisition is the **largest external/platform dependency** and must be validated before significant investment.

Technical ability to retrieve captions does not automatically establish long-term platform stability or policy safety. YouTube implementation changes, token behavior, rate limiting, Chrome Web Store requirements, and YouTube terms all need continued attention.

---

## 12. Caption Reliability Spike

Before polishing the product, test caption retrieval on at least 100 varied videos.

Include:

- Creator-uploaded captions
- Auto-generated captions
- New videos
- Old videos
- Short videos
- Multi-hour videos
- Different channels
- Videos without captions
- Multiple languages
- Poor/noisy automatic captions
- Videos with chapters
- Videos without chapters
- Edge cases such as restricted/unavailable content where appropriate

Measure:

- Caption success rate
- Median latency
- p95 latency
- Failure reasons
- Rate-limit incidence
- Token/session failures
- Browser restart behavior
- Caption type differences
- Impact of multiple concurrent requests

### Gate

If caption retrieval is unreliable enough to undermine the user promise, redesign the ingestion strategy before building the larger product.

---

## 13. Metadata Evaluation

All visible results can initially receive lightweight evaluation using available signals such as:

- Title
- Description
- Chapters
- Duration
- Publication date
- Channel information where useful

The top approximately five results then receive deep caption checks.

Do not permanently hardcode a rule such as "metadata can never produce Great." The benchmark should determine which evidence combinations are reliable enough.

However, metadata-only and caption-verified recommendations should remain distinguishable in the UI.

---

## 14. Relevant-Start Timestamp

`starts 2:40` is one of Piqsy's most valuable features—and one of the hardest.

Classification and localization should be evaluated separately.

A model can correctly determine that a video is `Great` while identifying the wrong start timestamp.

Suggested timestamp evaluation:

- **Excellent:** within ±30 seconds of human judgment
- **Acceptable:** within ±90 seconds
- **Poor:** more than 90 seconds away

It is better to show:

`✓ Great`

than confidently show an incorrect:

`✓ Great · starts 2:40`

Timestamp display should therefore have its own confidence threshold.

---

## 15. Accuracy Benchmark

The proposed launch gate should use approximately **500 query-video-level cases**, not merely 500 unique videos.

A case consists of:

`query + user level + video + human judgment`

The benchmark should intentionally include difficult categories:

- Exact matches
- Partial coverage
- Misleading titles
- Long courses where the topic is buried
- Wrong-level videos
- Outdated tutorials
- Missing captions
- Noisy auto-captions
- Excellent chapters
- Poor metadata
- Similar/confusable concepts
- Coding tutorials
- Theory explanations
- Mathematics
- Engineering topics

Suggested split:

- ~300 development/training examples
- ~100 threshold/calibration examples
- ~100 untouched final evaluation examples

At least a meaningful subset should be labeled independently by more than one human to measure disagreement in the task itself.

---

## 16. Accuracy Priorities

Overall accuracy alone is not enough.

False `Great` recommendations are particularly damaging.

Piqsy should optimize for **high precision on Great**, even at the cost of lower recall.

For example, conceptually:

```text
Great precision: 95%
Great recall: 72%
```

may be preferable to:

```text
Great precision: 82%
Great recall: 96%
```

The product can safely say `Partial` or `Unsure` more often while trust is being established.

Track a confusion matrix for:

- Great
- Partial
- Skip
- Unsure

and evaluate metadata-only and transcript-based paths independently.

---

## 17. Recommended Architecture

```text
YouTube Search
      │
      ▼
Chrome Content Script
      │
      ├── Extract query
      ├── Extract visible video results
      └── Inject Piqsy UI
      │
      ▼
Cache Lookup
      │
 ┌────┴────┐
 │         │
HIT       MISS
 │         │
Badge    Metadata evaluation
 │         │
 │        Jev
 │         │
 │     Quick verdict
 │         │
 │     Badge appears
 │         │
 │    Top ~5 uncached
 │         │
 │    Browser captions
 │         │
 │      Backend
 │         │
 │       Jev
 │         │
 │  Structured knowledge
 │         │
 └──────► Cache
           │
           ▼
      Upgrade badge
```

---

## 18. Backend Philosophy

Do not start with microservices.

An initial architecture can be:

```text
Chrome Extension
      ↓
API
      ↓
FastAPI / Node.js
      ↓
PostgreSQL
      ↓
Jev
```

Redis can be introduced when measurements show a need for a dedicated hot cache.

The engineering challenge is primarily **trust, latency, evaluation, and platform integration**, not early backend scale.

---

## 19. Example Data Model

### videos

```text
video_id
title
channel
duration
published_at
metadata_hash
analysis_version
last_analyzed_at
```

### video_segments

```text
video_id
start_seconds
end_seconds
topic
level
segment_type
confidence
```

### intents

```text
intent_id
normalized_topic
intent_type
```

### evaluations

```text
video_id
intent_id
user_level
coverage
fit
confidence
relevant_start
freshness_flag
format
analysis_source
model_version
created_at
```

Versioning is essential because cached judgments need to be attributable to the evaluator/rubric that produced them.

---

## 20. Cache Invalidation

Do not assume an evaluation remains correct forever.

Potential invalidation reasons:

- Metadata changes
- Captions change
- Evaluator/model changes
- Prompt/question/rubric changes
- Freshness judgments age
- Incorrect result is reported
- Video becomes unavailable

Stable content understanding can use long lifetimes, while freshness-sensitive judgments can expire sooner.

Lazy re-evaluation is preferable to reprocessing the entire corpus whenever the evaluator changes.

---

## 21. Privacy

The proposed privacy posture is a product strength if implemented accurately:

`Browser obtains captions → backend processes → raw transcript not intentionally retained → structured result cached`

Piqsy should minimize browser permissions and request only the access necessary for its YouTube functionality.

Avoid broad permissions such as access to all websites unless a future feature genuinely requires them.

Privacy claims must match actual behavior, including infrastructure/provider logging and any AI-provider retention behavior.

---

## 22. Cost Model

Do not assume the product will cost "a few dollars per day" until measured.

Instrument actual costs for:

- Metadata evaluation
- Transcript evaluation
- Intent normalization
- LLM fallback
- Database/cache operations
- Hosting

Then model scenarios such as:

- 100 DAU
- 1,000 DAU
- 10,000 DAU
- 100,000 DAU

Important variables:

```text
searches per user per day
results evaluated per search
transcripts deeply evaluated per search
average transcript size
cache-hit percentage
normalized-intent reuse
LLM fallback percentage
```

The shared knowledge/index model should improve economics as popular educational videos are repeatedly encountered.

---

## 23. V1 Scope

### Build

- Chrome extension on YouTube search
- Pending state
- Great / Partial / Skip / Unsure
- Metadata evaluation
- Top-result caption evaluation
- User-selected learning level
- Relevant-start timestamp when confidence is sufficient
- Compact hover explanation
- Basic backend
- Shared cache
- Evaluation/version tracking
- Instrumentation

### Explicitly defer

- Accounts
- Payments
- Mobile application
- Firefox support
- Chat-with-video
- Social features
- Creator ratings
- Complex dashboards
- Watch-history intelligence
- Elaborate recommendations
- Sophisticated personalization
- Full learning paths
- Sort by Fit until badge trust is validated

---

## 24. Why Sort by Fit Should Come Later

Annotating YouTube's ranking is a lower-risk intervention than replacing it.

First establish that users trust Piqsy's judgments.

Then a future:

> **Sort by Fit**

can reorder results based on Piqsy's matching engine.

This can later become a differentiating or premium feature, but it should not complicate initial validation.

---

## 25. Standalone Platform Vision

The extension should be treated as the first client of a broader **Piqsy Engine**.

```text
                 Piqsy Engine
                      │
          Video Knowledge Index
                      │
              Matching Engine
                      │
                Jev + fallback
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Extension    Web App     Future App
```

The engine—not the extension—is the long-term product foundation.

---

## 26. Piqsy Search

A future standalone site can allow users to search the already indexed knowledge base directly.

Example query:

> `How does Kafka consumer group rebalancing work?`

Instead of ordinary keyword-ranked videos, Piqsy can return:

```text
#1 Kafka Consumer Groups Explained
96% match
Start at 4:18

✓ Consumer groups
✓ Rebalancing
✓ Partition assignment
✓ Consumer failures

Level: Intermediate
Format: Diagram explanation
```

This moves Piqsy from an annotation layer into an educational-content search engine.

---

## 27. Segment-Level Search

Long term, Piqsy should think in **segments**, not merely videos.

For example:

> `How does database indexing work?`

could produce:

```text
1. Indexing fundamentals
   Video A · 2:14–8:31

2. B+ Trees
   Video B · 14:20–25:10

3. Clustered vs non-clustered indexes
   Video C · 5:42–13:30

4. Practical SQL example
   Video D · 18:10–27:05
```

This is more differentiated than simply recommending a three-hour course.

---

## 28. Learning Paths

Once Piqsy has a sufficiently rich segment index, it can assemble learning paths.

Example:

> `I know Docker. Teach me Kubernetes from beginner level.`

Piqsy could produce:

```text
1. Why Kubernetes exists
   Video A · 3:20–11:40

2. Pods
   Video B · 5:12–16:30

3. Deployments
   Video C · 12:40–25:11

4. Services
   Video D · 8:04–20:12

5. ConfigMaps & Secrets
   Video E · 21:14–33:00

6. Hands-on deployment
   Video F · 4:10–29:00
```

This should be viewed as a later product built on top of validated matching/indexing technology—not a V1 feature.

---

## 29. Platform Independence

Do not hardwire the core domain model around `YouTubeVideo` everywhere.

Prefer abstractions such as:

```text
ContentSource
ContentItem
ContentSegment
Concept
Intent
Evaluation
```

YouTube can initially be:

```text
source = YOUTUBE
```

This preserves the ability to support other educational video sources in the future where access, indexing, licensing, and platform rules permit it.

---

## 30. Potential Data Advantage

Over time, Piqsy could accumulate a structured educational-video index:

```text
video
→ concepts
→ timestamps
→ difficulty
→ format
→ freshness
→ query relationships
```

For example:

```text
Kafka
 ├── partitions
 │    ├── Video A · 3:20
 │    └── Video D · 14:10
 │
 ├── consumer groups
 │    ├── Video A · 8:12
 │    ├── Video C · 2:44
 │    └── Video F · 21:09
 │
 └── exactly-once semantics
      ├── Video C · 18:32
      └── Video G · 7:51
```

If this index becomes sufficiently broad and accurate, Piqsy becomes more defensible than a thin wrapper that sends every request directly to an AI model.

---

## 31. Product Flywheel

The extension and standalone platform can reinforce each other:

```text
More extension users
       ↓
More educational videos encountered
       ↓
More structured video knowledge
       ↓
Better Piqsy search/index
       ↓
Better standalone product
       ↓
More users
       ↓
More extension adoption
       ↺
```

This is one of the more interesting long-term aspects of the concept.

---

## 32. Competition & Differentiation

Video summarizers, transcript tools, timestamp generators, and "worth watching" tools already exist.

Piqsy should therefore avoid competing on:

- "AI understands videos"
- Generic summaries
- Chat with a transcript
- Generic chapter generation

Its differentiated promise should remain:

> **Query-specific fit before the click.**

The key questions are:

- Does this answer what *I* searched?
- Is it appropriate for *my* level?
- Where does the relevant content begin?
- What important parts are missing?

---

## 33. Positioning

Do not lead consumer marketing with the underlying model.

Users care about saved time and better learning decisions, not whether Jev or another model powers the judgment.

Possible positioning:

> **Pick the right video. First time.**

or

> **Stop opening five videos to find the right one.**

The product experience should explain the value in seconds.

---

## 34. Metrics

Avoid optimizing primarily for installs or AI request volume.

Important metrics include:

### Trust

- `Great` precision
- User disagreement rate
- Unsure rate
- Reported bad recommendations

### Utility

- First-click success
- Number of videos opened before settling
- Time to useful content
- Relevant timestamp usage
- Search abandonment

### Retention

- Extension still installed after 7/30 days
- Searches evaluated per active user
- Repeat usage

### System

- Metadata evaluation latency
- Deep-check latency
- Cache hit rate
- Caption retrieval success
- LLM fallback percentage
- Cost per search

One particularly meaningful concept is **bad-click avoidance**: how often Piqsy helps the learner avoid opening a result that would not have satisfied the query.

---

## 35. User Validation Experiment

A useful early study could involve approximately 20 users performing around 10 technical searches each.

Measure:

- Time to choose a video
- Number of videos opened
- First-video success
- Agreement with badges
- False `Great` rate
- Timestamp usefulness

A strong qualitative question is:

> **If Piqsy disappeared tomorrow, would you care?**

Retention and behavioral change matter more than initial excitement.

---

## 36. Major Risks

| Risk | Severity |
|---|---|
| Caption access reliability / platform dependency | Very High |
| Users losing trust because of false `Great` results | Very High |
| Query-dependent caching and intent normalization | High |
| Relevant-start timestamp accuracy | High |
| Jev performance on long/noisy transcripts | High |
| Latency before deep-check upgrade | High |
| YouTube DOM/implementation changes | Medium |
| AI cost | Medium |
| Competition | Medium |
| Early backend scale | Low |

The hardest problems are not CRUD/backend implementation. They are reliability and trust.

---

## 37. Development Sequence

### Phase 0 — Kill the idea cheaply

Goal: prove or disprove the two foundational assumptions.

1. Caption retrieval spike
2. Initial Jev evaluation spike
3. ~50–100 manually judged query/video cases
4. Timestamp experiment

**Proceed only if the results are promising.**

### Phase 1 — Ugly end-to-end prototype

Target experience:

`YouTube search → Pending → caption → Jev → real badge`

No accounts, payments, sophisticated caching, or visual polish.

### Phase 2 — Functional V1

Add:

- Backend
- Shared cache
- Level setting
- Hover details
- Reliable error states
- Evaluation versioning
- Instrumentation

### Phase 3 — 500-case benchmark

Calibrate thresholds and determine whether the product is trustworthy enough to expose `Great` recommendations publicly.

### Phase 4 — Small external beta

Target approximately 20–50 genuine users who regularly use YouTube for technical learning.

### Phase 5 — Public extension

Only after reliability, privacy, permissions, and evaluation are strong enough.

### Phase 6 — Standalone Piqsy Search

Search the accumulated structured content index directly.

### Phase 7 — Learning paths / broader platform

Only after evidence of repeat usage and a sufficiently rich index.

---

## 38. Prototype 0.1 Definition

A motivating first finish line:

> Search `Kafka consumer groups` on YouTube, inject Piqsy badges beside the first five results, retrieve captions for at least one result, evaluate it, and replace `Pending` with a real verdict.

Example final state:

```text
Piqsy ✓ Great · starts 4:12
```

For Prototype 0.1, do not require:

- Production database
- User accounts
- Perfect name/domain
- Public Chrome Store release
- Full 500-case benchmark
- Sort by Fit
- Standalone web app

The objective is to prove the complete intelligence loop works in a real browser.

---

## 39. Job-Search Value

Piqsy is particularly valuable as a portfolio project if it becomes a **real, demonstrable, measured product** rather than another repository.

It creates interview discussion around:

- Product discovery
- Chrome extension architecture
- DOM integration
- Backend APIs
- Database design
- Shared caching
- AI inference
- Confidence calibration
- Evaluation systems
- Latency optimization
- Privacy
- Cost optimization
- Failure handling
- Deployment
- Production monitoring
- Scaling tradeoffs

A strong future interview pitch could be:

> "I noticed that when I searched YouTube for technical concepts, I'd often open several videos before finding one that actually answered my question. I built Piqsy, a Chrome extension that evaluates YouTube search results against the user's exact learning intent and skill level. It progressively evaluates metadata and transcripts, shows a Great/Partial/Skip verdict with the relevant timestamp, and shares structured evaluations across users. I built the extension, backend, AI evaluation pipeline, caching system, and an accuracy benchmark."

The strongest version of the project also has real measurements, for example:

```text
X active users
Y videos/segments indexed
Z% precision on Great recommendations
N ms median cached response
M% caption retrieval success
```

Only report metrics that are actually measured.

---

## 40. Time Investment During Job Search

Piqsy should strengthen the job search, not consume it.

Recommended principle:

> **Give Piqsy seven days to earn the next fourteen.**

During the first week, prove:

- Caption acquisition works sufficiently well
- Jev can make useful decisions
- A real YouTube page can display the end-to-end result

If those assumptions fail badly, redesign or stop rather than continuing because of sunk cost.

If they succeed, a focused 2–3 week V1 is reasonable.

Do not spend months building the full platform before user validation.

---

## 41. Go / No-Go Gates

### Gate A — Caption feasibility

**Go if:** caption retrieval succeeds reliably across representative videos with acceptable latency and failure behavior.

**Reconsider if:** the mechanism is fragile, frequently rate-limited, or creates unacceptable platform/policy risk.

### Gate B — Recommendation quality

**Go if:** `Great` can achieve very high precision on representative human-labeled cases.

**Reconsider if:** obvious false positives remain common even with transcripts.

### Gate C — Timestamp quality

**Go if:** relevant-start timestamps are usually within an acceptable human-defined range.

**Degrade gracefully if not:** ship verdicts without timestamps until localization improves.

### Gate D — User value

**Go if:** early users make better/faster video choices and continue using the extension.

**Reconsider if:** users find the badges interesting but ignore them in real searches.

### Gate E — Economics

**Go if:** caching plus Jev keeps cost per active user reasonable and fallback usage is controlled.

**Reconsider architecture if:** most searches require expensive transcript/LLM processing with poor cache reuse.

---

## 42. Final Assessment

Piqsy is worth building as a focused validation project because it combines a clear user problem with technically interesting challenges and an unusually strong demonstration story.

The initial Chrome extension alone can be useful. The larger opportunity is a **query-to-content matching engine** that develops a structured index of educational video segments and eventually powers independent search and learning experiences.

The project should not be justified by the existence of AI or by the desire to build another portfolio item. It earns continued investment only if it can reliably answer:

> **For what I am trying to learn, which video should I watch, and where should I start?**

The two assumptions that deserve immediate attack are:

1. **Can Piqsy reliably obtain usable timestamped captions from the browser?**
2. **Can Piqsy identify genuinely good matches with sufficiently high precision that users trust the badge?**

If both survive real testing, proceed to a polished V1. If they do not, change the architecture before investing further.

The correct immediate objective is therefore not "build the whole startup." It is:

> **Make one real YouTube search produce one trustworthy Piqsy recommendation end to end.**

That is Prototype 0.1.

---

## 43. Immediate Next Action

Start with one vertical slice:

```text
YouTube search
    ↓
Read search query
    ↓
Detect first five video results
    ↓
Inject Pending badges
    ↓
Retrieve caption track for one result
    ↓
Send query + level + timestamped captions to evaluator
    ↓
Receive structured verdict
    ↓
Replace Pending
    ↓
Piqsy ✓ Great · starts X:XX
```

Do not add additional architecture until this path works reliably enough to measure.

---

*This document is a working product/engineering audit. Numerical thresholds, pricing assumptions, platform behavior, and evaluator performance should be replaced with measured results as Piqsy progresses through validation.*
