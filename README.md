# Piqsy

A Chrome extension that tells you which YouTube search results actually explain what you searched for, and where.

Search YouTube to learn something ("b+ tree deletion", "kafka consumer group rebalancing") and the top 5 results get a chip on the thumbnail:

| Chip | Meaning |
|---|---|
| `✓ Great` | Watching from where the relevant section starts would teach you what you searched for. |
| `◐ Partial` | Covers the topic, but you'll likely need another source. |
| `✕ Not covered` | Piqsy read the captions and didn't find your topic explained. |
| `? Unsure` | Piqsy read the captions and can't tell. |
| `no captions` / `Piqsy error` | Piqsy couldn't check this video. |

Hover a chip to see the caption snippet that best matches your query. Open a rated video and a strip under the player lists up to 3 time ranges (`Watch 4:18–9:40 · 31:02–35:10`); click one to jump there. This matters most for long courses, where the part you need is buried somewhere in 3 to 24 hours of video.

Verdicts come from the video's captions, not its title. Piqsy splits the captions into time windows and asks [Jev](docs/jev.md) (TypeSafe AI's decision model) how well each window explains your query. Searches that aren't about learning, like music, get no chips.

## Status

Early: V1 works and is checked by hand in Chrome, but verdict accuracy hasn't been benchmarked yet and it isn't on the Chrome Web Store. Progress is tracked slice by slice in [.scratch/badge/issues/](.scratch/badge/issues/).

The main open problem is that **YouTube blocks caption requests** from an IP that fetches too many (HTTP 429, or "Sign in to confirm you're not a bot"). A block also breaks your own YouTube captions for a while. Piqsy stops all caption requests for 30 minutes after a block and saves captions it has already fetched, but heavy use can still trigger one. See [docs/youtube-blocks.md](docs/youtube-blocks.md).

## Install

You need a Jev API key from [console.typesafe.ai](https://console.typesafe.ai) (Jev is in early access).

1. Clone this repo.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `extension/` folder.
3. Open Piqsy's **Details → Extension options**, paste your Jev key and click **Save and check**.
4. Search YouTube for something you want to learn.

The toolbar popup has an on/off switch for all searches. To use Piqsy in Incognito, turn on **Allow in Incognito** in its details.

## Privacy

There is no Piqsy server. Your Jev key, saved captions and the run log stay in your browser. Caption windows and your query are sent to Jev's API to be scored.

## Development

Plain JavaScript, Manifest V3, no build step, no dependencies.

```
node --test
```

After changing code, click ↻ on Piqsy in `chrome://extensions` **and** reload the YouTube tab. Reloading only one leaves the old code running.

- **Logs:** on a YouTube page, open DevTools → Console and filter by `[piqsy]`. Jev calls run in the service worker; open it from the "service worker" link on `chrome://extensions`.
- **Run log:** the options page exports every evaluation (query, video, caption outcome, latency, verdict, ranges) as JSON.
- **Demo mode:** run `localStorage.piqsyDemo = 1` in the console on YouTube and reload to see every chip state.
- **Don't bulk-fetch captions.** Test with a few short videos. Scripts that download many caption files get your IP blocked.

| File | Role |
|---|---|
| `content.js` | Search page and watch page: finds results, shows chips and the strip |
| `captions.js` | Fetches captions, pauses after a block |
| `captionstore.js` | Saved captions per video |
| `windows.js` | Splits captions into time windows |
| `verdict.js` | Turns window scores into a verdict, ranges and hover text |
| `background.js`, `jev.js` | Service worker: the only caller of Jev; writes the run log |
| `runlog.js` | Persistent run log |
| `options.*`, `popup.*` | Jev key and log export; on/off switch |

### Docs

- [CONTEXT.md](CONTEXT.md): glossary (Window, Verdict, Range, Block and so on)
- [docs/prd/badge-v1.md](docs/prd/badge-v1.md): what V1 does and why
- [docs/adr/](docs/adr/): the big decisions (window scoring, no backend, captions via the ANDROID client, broad vs narrow queries)
- [docs/jev.md](docs/jev.md): what Jev is and how Piqsy uses it
- [docs/captions-spike.md](docs/captions-spike.md): how captions are fetched and how fast it is
- [docs/assessment.md](docs/assessment.md): open risks
- [docs/future-plans.md](docs/future-plans.md): ideas deliberately postponed

## License

[MIT](LICENSE)
