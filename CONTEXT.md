# Piqsy — Domain Glossary

Use these terms exactly. Avoid the listed synonyms.

| Term | Meaning | Avoid |
|---|---|---|
| **Query** | The raw text the user typed into YouTube search. | intent (until intent normalisation exists) |
| **Learning query** | A query whose purpose is to learn a concept or skill, as judged by the learning-query check. Non-learning queries get no chips. | educational search |
| **Broad query** | A learning query for a whole subject ("dsa full course", "learn kafka"). Judged by how much of the video is on the subject (ADR 0005). | general query |
| **Narrow query** | A learning query for one concept ("b+ tree deletion"). Judged by the best windows and ranges. The default when Piqsy can't tell. | specific query |
| **Format words** | Words in a query that describe the video, not the topic ("full course", "tutorial", "for beginners"). Removed before scoring; a hint toward broad. | |
| **Result** | One regular video in YouTube's search results. Only the top 5 are evaluated. Shorts, ads, channels, playlists and mixes are not results. | item, card |
| **Captions** | Timestamped English text of a video (creator-written or auto-generated; never auto-translated). | transcript (fine informally), subtitles |
| **Window** | A contiguous time slice of captions (2 min by default, longer for long videos) scored by Jev. | chunk, segment |
| **Window score** | Jev's `noul` probability that a window explains the query. | confidence, relevance score |
| **Verdict** | The per-(query, video) outcome: **Great**, **Partial**, **Not covered**, **Unsure**. | rating, fit score |
| **Great** | Watching from where the relevant section starts would teach the searcher what they searched for. The only loud state; false Greats are the worst error. | |
| **Partial** | Covers the query, but you'd need another source. | |
| **Not covered** | Piqsy read the captions and didn't find the query explained. | Skip |
| **Unsure** | Piqsy read the captions and can't tell. Never used for failures. | |
| **no captions** / **Piqsy error** | Piqsy couldn't check (no English captions / a failure). Not verdicts. | Unsure |
| **Range** | A run of consecutive relevant windows, start shifted 10 s earlier. Up to 3 per video. | timestamp (a range has a start *and* end) |
| **Relevant throughout** | Relevant windows cover ≥ 40% of the video; shown instead of ranges. | |
| **Chip** | The badge on a search result's thumbnail (top-left). | badge (OK informally), pill |
| **Strip** | The bar under the player on the watch page that lists ranges. | banner |
| **Block** | YouTube refusing Piqsy's caption requests from an IP: timedtext HTTP 429, or the player's "Sign in to confirm you're not a bot". Shows as `Piqsy error`; also breaks the user's own YouTube captions while it lasts. | ban, rate limit (only for the 429) |
| **Pause** | After a block, Piqsy sends no caption requests for 30 min (all tabs). Chips show `Piqsy error` meanwhile. | cooldown, backoff |
| **Jev** | TypeSafe AI's decision model; see `docs/jev.md`. | the LLM, the AI |
