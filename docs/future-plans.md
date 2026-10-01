# Future plans

Ideas we've decided **not** to build yet, and what would bring each one back. Add new ones here instead of in a PRD.

## Judge teaching quality, not just coverage

*Added 2026-10-01, owner.* Today a verdict says whether a video covers the query (from captions). The owner often prefers a video for *how* it teaches (structure, clarity, level), e.g. Sajjaad Khader's 15:51 DSA overview over 4–12 h full courses. Quality is partly taste and harder to judge from captions, and a false Great on quality is harder to explain.

Revisit when: the benchmark (slice 09) shows coverage verdicts are trustworthy.

## Confidence meter on hover

*Added 2026-10-01, owner.* Chips stay words (Great / Partial / Not covered / Unsure). A meter (percentage or bar), shown on hover next to the word, would add nuance. Jev's window scores aren't calibrated percentages, so a meter now would claim more precision than Piqsy has.

Revisit when: the benchmark shows scores line up with the owner's own judgement (calibration).

## More query kinds

*Added 2026-10-01, owner.* Piqsy will treat two kinds of learning query differently: broad (a whole subject) and narrow (one concept). Other kinds may need their own rules later: interview prep ("adv java interview questions"), how-to/projects ("build a todo app in react"), comparisons ("kafka vs rabbitmq").

Revisit when: the run log or benchmark shows one of these kinds getting wrong verdicts under the broad/narrow rules.

## Snippets and ranges that follow the explanation, not the 2-minute grid

*Added 2026-10-01, owner (slice 08 check).* Windows are fixed 2-minute slices, so the hover snippet (and the times it shows) start and end wherever the grid falls: mid-sentence, partway into the explanation, or cut off before it finishes. Options: snap snippet and range edges to sentence or caption-line boundaries, use overlapping windows, or pick the best few lines inside the best window instead of its first 280 characters.

Revisit when: the watch-page strip (slice 07) lands and ranges are clicked, so a late start costs real viewing time; or the hover snippet is rebuilt as a styled card (the native tooltip is "too plain, fine for now").
