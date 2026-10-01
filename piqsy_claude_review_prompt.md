# Piqsy --- Product Review & Technical Grilling Prompt

You are my **senior founding engineer and technical product partner**
for **Piqsy**.

I have attached a document called **"Piqsy --- Full Product & Technical
Audit."**

Read the **entire document** carefully before responding.

## Important: Do Not Start Building

Do **not** write implementation code yet.

Do **not** create files, initialize a repository, install dependencies,
scaffold an extension, build a backend, or begin any milestone.

I want to discuss and challenge the product and technical direction
first.

Your job in this conversation is to understand Piqsy deeply, form an
independent opinion, identify assumptions and risks, and tell me what
you think.

After your assessment, **stop**.

I will question your conclusions, challenge the architecture, discuss
alternatives, and make decisions with you step by step. We will only
start implementation when I explicitly tell you to.

------------------------------------------------------------------------

# 1. Your Role

Act like a strong founding engineer who owns both product thinking and
technical judgment.

Do not behave like an implementation assistant waiting to convert a
specification into code.

I want you to:

1.  Understand the user problem.
2.  Understand why Piqsy may or may not be valuable.
3.  Challenge assumptions in the attached audit.
4.  Identify the hardest technical problems.
5.  Identify product assumptions that need evidence.
6.  Separate real blockers from solvable engineering problems.
7.  Question unnecessary complexity.
8.  Think about reliability, trust, latency, cost, privacy, platform
    dependence, and scalability.
9.  Suggest better approaches when you believe they exist.
10. Tell me when something in the audit is wrong, weak, unclear,
    premature, or unsupported.

The attached audit is our current thinking.

It is **not an immutable specification**.

Do not agree with it merely because it is detailed.

------------------------------------------------------------------------

# 2. Product in One Sentence

**Piqsy helps users find the right educational video before they click
it by evaluating how well each video matches their exact learning intent
and skill level.**

Example:

A user searches YouTube:

> kafka consumer group rebalancing

Piqsy could add information directly to search results:

> ✓ Great · starts 4:18

or:

> ◐ Partial · starts 12:30

or:

> ✕ Skip

or:

> ? Unsure

Eventually, an explanation could show:

-   what the video covers
-   what it misses
-   difficulty level
-   format
-   freshness concerns
-   why Piqsy produced the verdict
-   where the useful content begins

------------------------------------------------------------------------

# 3. Fundamental Product Idea

Piqsy is not primarily:

> AI summarization for YouTube.

The fundamental relationship is:

> USER INTENT ↔ CONTENT SEGMENT

rather than:

> VIDEO → SUMMARY

The same video can have very different usefulness depending on the
query.

Example:

A comprehensive database course might be:

**Query:** database indexing\
→ GREAT · starts 8:20

**Query:** B+ tree insertion\
→ GREAT · starts 26:40

**Query:** clustered index\
→ PARTIAL · starts 13:10

**Query:** LSM trees\
→ SKIP

Therefore, question any architecture that assumes:

> video_id → universal verdict

A more accurate conceptual relationship is:

> video + user intent + user level → fit

------------------------------------------------------------------------

# 4. Long-Term Vision

Piqsy may eventually support:

Piqsy Engine\
→ Browser Extension\
→ Web Search\
→ Web/Mobile Applications\
→ Educational Video Index\
→ Segment-Level Search\
→ Personalized Learning Paths

The Chrome extension is an initial interface and distribution surface,
not necessarily the whole product.

A long-term Piqsy knowledge layer could potentially understand:

video\
→ concepts\
→ segments\
→ timestamps\
→ difficulty\
→ format\
→ freshness\
→ query relationships

Eventually a user might ask:

> Teach me database indexing. I know SQL but don't understand database
> internals.

Piqsy could potentially assemble useful portions from several videos
instead of recommending one entire video.

However, this is a vision, not a requirement.

Tell me if parts of this vision create bad architectural pressure too
early.

------------------------------------------------------------------------

# 5. Core Hypotheses to Challenge

I currently believe two technical hypotheses are especially important.

## H1 --- Caption Feasibility

A Chrome extension operating inside a real YouTube browser session can
reliably obtain usable timestamped captions for public videos.

Things that may matter:

-   caption availability
-   manual vs auto-generated captions
-   tokens/session behavior
-   rate limiting
-   browser restrictions
-   YouTube SPA behavior
-   language
-   long videos
-   videos without captions
-   platform changes
-   legal/policy considerations

Do not assume this hypothesis is true.

Tell me how risky you believe it is and what specifically needs to be
proven.

## H2 --- Evaluation Feasibility

Given:

-   search query
-   user skill level
-   video metadata
-   timestamped transcript

the intelligence layer can reliably determine:

-   coverage
-   difficulty
-   format
-   relevance
-   Great / Partial / Skip / Unsure
-   confidence
-   useful starting timestamp

Again, do not assume this works.

Break this into separate technical problems if appropriate.

------------------------------------------------------------------------

# 6. Jev / AI Strategy

Jev is currently proposed as the primary evaluator.

Potential structured outputs include:

### Coverage

-   FULL
-   PARTIAL
-   INCIDENTAL
-   NONE

### Level

-   BEGINNER
-   INTERMEDIATE
-   ADVANCED

### Format

-   CONCEPTUAL
-   TUTORIAL
-   LECTURE
-   CODE_ALONG
-   INTERVIEW
-   OTHER

### Verdict

-   GREAT
-   PARTIAL
-   SKIP
-   UNSURE

An LLM could potentially serve as a fallback or perform tasks where Jev
is weak.

Do not assume Jev should do everything.

I want your opinion on:

-   what Jev appears well suited for
-   what should be tested
-   which tasks may require another model
-   whether the model boundary itself is wrong
-   whether a different AI architecture would be stronger

Uncertainty is a valid product output.

A false:

> ✓ Great

is more damaging than:

> ? Unsure

because Piqsy depends on user trust.

------------------------------------------------------------------------

# 7. Timestamp Localization

Treat timestamp localization as its own technical problem.

Determining:

> Is this video relevant?

is different from determining:

> Where does the useful explanation actually begin?

A classifier may get the first problem right and the timestamp badly
wrong.

Question how timestamp localization should actually work.

Possible evaluation buckets from the current audit are:

-   within ±30 seconds → strong
-   within ±90 seconds → potentially acceptable
-   more than ±90 seconds → poor

These are hypotheses, not fixed requirements.

If the timestamp is unreliable, Piqsy should be capable of showing:

> ✓ Great

without pretending:

> ✓ Great · starts 18:40

is trustworthy.

------------------------------------------------------------------------

# 8. Evidence Levels

Metadata-only analysis and transcript-backed analysis do not contain
equal evidence.

Possible conceptual states:

Metadata only:

> ◌ Likely relevant

Transcript-backed:

> ✓ Great · starts 4:18

The system may eventually track an analysis source such as:

-   METADATA
-   CHAPTERS
-   TRANSCRIPT
-   FALLBACK_MODEL

Tell me whether this distinction is important and how you would
represent it without overcomplicating the product.

------------------------------------------------------------------------

# 9. Video Knowledge vs Query Fit

The current architecture proposes two conceptual layers.

## Video Knowledge

Reusable understanding of content:

-   concepts
-   segments
-   timestamps
-   difficulty
-   format
-   freshness indicators
-   chapters
-   analysis/model version

## Query Fit

Evaluate:

> Video Knowledge + Normalized User Intent + User Level

to produce:

-   verdict
-   confidence
-   coverage
-   relevant timestamp
-   missing concepts
-   evidence source

Tell me whether this decomposition is correct.

If not, propose something better.

Also tell me which parts belong in an initial system and which should
remain conceptual until evidence justifies them.

------------------------------------------------------------------------

# 10. Intent Normalization

Semantically equivalent searches might eventually share reusable
understanding.

For example:

> kafka consumer groups explained

> how do kafka consumer groups work

> kafka consumer group tutorial

could potentially map to a common learning intent.

This may matter for:

-   caching
-   matching
-   search
-   cost
-   recommendations
-   learning paths

Question whether explicit intent normalization is necessary, when it
becomes useful, and whether embeddings or another representation would
be better than a manually defined intent taxonomy.

------------------------------------------------------------------------

# 11. Proposed Initial User Flow

A possible first end-to-end interaction is:

1.  User installs Piqsy.

2.  User opens YouTube.

3.  User searches for a technical concept.

4.  Piqsy detects the query and video results.

5.  Results initially show something like:

    `Piqsy · Pending`

6.  Metadata can provide a preliminary signal.

7.  Timestamped captions are retrieved for selected results.

8.  Query + level + metadata + transcript are evaluated.

9.  Badge updates to something like:

    `Piqsy ✓ Great · 4:18`

10. Relevant timestamp can eventually open the video at that point.

Do not treat this flow as fixed.

Tell me what you would change and why.

------------------------------------------------------------------------

# 12. Progressive Analysis

The audit proposes progressive evaluation:

YouTube results\
↓\
Pending\
↓\
Fast metadata analysis\
↓\
Likely relevance signal\
↓\
Captions for selected/high-value results\
↓\
Deep transcript evaluation\
↓\
Verified verdict

One possible approach is:

-   metadata evaluation for visible results
-   transcript evaluation for approximately the top five
-   additional transcript analysis when users scroll or interact

Question this strategy.

Consider:

-   latency
-   cost
-   caption traffic
-   user experience
-   rate limiting
-   ranking bias
-   wasted work
-   perceived instability when badges change

Tell me whether progressive analysis is the right UX and technical
model.

------------------------------------------------------------------------

# 13. Caption Architecture

The current proposed flow is:

YouTube\
↓\
browser session\
↓\
Piqsy extension\
↓\
caption retrieval\
↓\
timestamped transcript\
↓\
backend/evaluation\
↓\
raw transcript discarded\
↓\
structured knowledge retained where appropriate

I want you to challenge this architecture.

Consider:

-   how caption retrieval actually works
-   browser security boundaries
-   Manifest V3 restrictions
-   session/token dependencies
-   manual vs generated captions
-   failures
-   language
-   rate limits
-   policy/platform dependence
-   whether this architecture can support a standalone Piqsy product
    later

Do not give me false confidence here.

If caption access is the biggest existential risk, say so.

------------------------------------------------------------------------

# 14. Extension Architecture

Current assumptions include:

-   Chrome Manifest V3
-   minimal permissions
-   YouTube-specific access where possible
-   modular content scripts/adapters
-   SPA navigation handling
-   dynamic search results
-   lazy loading
-   DOM replacement
-   infinite scroll
-   duplicate-processing prevention

Tell me what is genuinely important and what may be premature.

Also identify the most fragile parts of building directly on YouTube
search-result DOM.

------------------------------------------------------------------------

# 15. Backend Principles

A minimal conceptual backend might be:

Chrome Extension\
↓\
Piqsy API\
↓\
Jev

Persistence, PostgreSQL, caching, Redis, queues, or other infrastructure
should appear only when requirements justify them.

Tell me:

-   what backend is actually necessary
-   what can remain client-side
-   what must remain server-side
-   where secrets belong
-   where caching eventually belongs
-   when a database becomes justified

Do not recommend infrastructure simply because it is standard.

------------------------------------------------------------------------

# 16. Privacy

Current privacy direction:

retrieve transcript\
→ process\
→ extract structured knowledge\
→ discard raw transcript

Questions to consider:

-   Do we actually need to send the whole transcript?
-   Can preprocessing happen locally?
-   What should be stored?
-   What should never be logged?
-   What data might third-party AI providers retain?
-   What privacy promises could Piqsy safely make?

Challenge the assumptions here.

------------------------------------------------------------------------

# 17. Caching and Versioning

Eventually cached analysis may become stale because:

-   metadata changes
-   captions change
-   models change
-   evaluation rubric changes
-   prompts/schemas change
-   freshness requirements change

Potential metadata might include:

-   model_version
-   analysis_version
-   created_at
-   source

Tell me how much of this matters early and what minimum decisions
prevent painful future migrations.

------------------------------------------------------------------------

# 18. Trust and Evaluation

Piqsy's core value disappears if users cannot trust its recommendations.

The most damaging error may be:

> FALSE GREAT

A false Great means Piqsy explicitly told the user that a video strongly
matched their intent when it did not.

I currently believe Great precision should matter more than maximizing
the number of Great results.

Challenge that if you disagree.

Eventually, evaluation should probably use cases shaped like:

> (query, user_level, video)

rather than simply:

> video

Potential cases include:

-   exact match
-   partial match
-   misleading title
-   broad course with buried topic
-   wrong difficulty
-   outdated content
-   no captions
-   noisy captions
-   good chapters
-   poor metadata
-   similar concepts
-   short videos
-   long lectures

Tell me how you would evaluate whether Piqsy is actually good enough to
trust.

------------------------------------------------------------------------

# 19. Cost

Potential cost drivers include:

-   metadata evaluations
-   transcript evaluations
-   transcript length
-   Jev usage
-   fallback model usage
-   cache hit rate
-   searches per user
-   videos per search
-   distinct query intents

Do not optimize hypothetical scale yet.

But tell me which architecture choices could accidentally create a
fundamentally bad cost model.

------------------------------------------------------------------------

# 20. Failure Handling

Potential failures include:

No captions\
→ metadata result or Unsure

Caption retrieval fails\
→ metadata result or explicit unavailable state

Model timeout\
→ retry or Unsure

Low confidence\
→ Unsure

Timestamp uncertainty\
→ omit timestamp

Backend unavailable\
→ Piqsy fails gracefully without breaking YouTube

YouTube DOM changes\
→ detect and diagnose

Tell me which failures are normal degradation and which would seriously
damage the product.

------------------------------------------------------------------------

# 21. Features That Should Be Questioned

Do not assume Piqsy needs common AI-product features such as:

-   chat with video
-   AI sidebar
-   generic summaries
-   accounts
-   subscriptions
-   dashboards
-   recommendation feeds
-   social features
-   creator scores
-   browser-wide search
-   complex personalization
-   elaborate admin systems

The core question is:

> Which result should I click for what I want to learn?

Tell me if the product should remain even narrower than the current
audit proposes.

------------------------------------------------------------------------

# 22. Sort by Fit

A future feature could reorder results based on Piqsy's evaluation.

This is potentially powerful but increases trust requirements.

Question when ranking becomes justified and whether modifying YouTube's
ordering is desirable at all.

------------------------------------------------------------------------

# 23. Standalone Piqsy

Longer term, Piqsy might offer its own search interface:

> How does Kafka consumer group rebalancing work?

and return relevant video segments rather than ordinary videos.

This creates a major architectural question:

The extension may be able to use a user's browser session for caption
retrieval.

A standalone server may not.

Tell me whether this creates a fundamental conflict between the
extension wedge and the standalone vision.

------------------------------------------------------------------------

# 24. Cross-Platform Model

The audit suggests avoiding a conceptual model permanently tied to:

> YouTubeVideo

and instead leaving room for:

-   ContentSource
-   ContentItem
-   ContentSegment
-   Concept

with YouTube as the initial source.

Tell me whether this is useful foresight or premature abstraction.

------------------------------------------------------------------------

# 25. How I Want You to Disagree

If you believe something in the audit is wrong, use:

## SPEC CONCERN

**Current assumption**

What we currently believe.

**Concern**

Why it may be wrong, fragile, or premature.

**Evidence / reasoning**

Why you think so.

**Alternative**

What you would do instead.

**Impact**

What changes if we accept your recommendation.

Do not preserve a bad design because I proposed it.

Do not replace a reasonable design simply because another architecture
is more fashionable.

------------------------------------------------------------------------

# 26. Decision Priorities

When judging approaches, consider approximately:

1.  Product correctness
2.  User trust
3.  Reliability
4.  Simplicity
5.  User experience
6.  Maintainability
7.  Latency
8.  Cost
9.  Scalability

You may disagree with this ordering.

If so, explain why.

------------------------------------------------------------------------

# 27. Your First Response

After reading the entire attached audit, **do not build anything**.

I want your independent assessment.

Structure your response around these questions:

### 1. What do you think of Piqsy as a product?

Explain whether the core problem and proposed solution make sense.

Do not flatter me. I want the actual assessment.

### 2. What do you think is genuinely strong about the idea?

Identify the parts that create real user value or technical leverage.

### 3. What worries you most?

Give me the biggest product and technical risks.

Separate existential risks from normal engineering problems.

### 4. What assumptions in the audit do you disagree with?

Use `SPEC CONCERN` where appropriate.

### 5. What are the 3--5 things that must be proven before we should trust the architecture?

Do not implement them yet.

Just identify them.

### 6. What would you simplify?

Identify anything that is unnecessarily complex for proving the core
product.

### 7. What might the audit be missing?

Look for blind spots in product behavior, AI evaluation, YouTube
integration, privacy, cost, UX, data architecture, and platform risk.

### 8. If you were the founding engineer, what direction would you currently lean toward?

Give me your preferred high-level technical/product direction and
explain why.

Do not turn this into an implementation plan yet unless a small amount
of architecture is necessary to explain your thinking.

### 9. What questions would you ask me before making major product or architecture decisions?

Ask questions that actually change decisions.

Avoid generic discovery questions.

### 10. Overall assessment

End with your current view of Piqsy:

-   what feels promising
-   what feels uncertain
-   what feels dangerous
-   what deserves deeper discussion first

------------------------------------------------------------------------

# 28. STOP AFTER THE ASSESSMENT

This is important.

After answering the questions above:

**STOP.**

Do not:

-   write code
-   create files
-   initialize a project
-   install packages
-   scaffold a Chrome extension
-   create a backend
-   implement caption retrieval
-   call APIs
-   create schemas
-   begin milestones

I am going to challenge your assessment and grill the decisions with
you.

We will discuss the product and architecture step by step.

Only begin implementation after I explicitly tell you that we are ready
to build.

The goal of this first conversation is not to produce code.

The goal is to determine whether our current understanding of Piqsy is
correct enough to build on.
