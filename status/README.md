# Incidents

`incidents.json` is what /status shows under "Incident reports". The page
reads it live from GitHub, so an edit here shows up on the site within about
five minutes (GitHub caches raw files for up to 5). No build, no deploy.

Edit it on github.com: open `status/incidents.json`, click the pencil, commit
to `main`.

Newest first. One object per incident:

```json
[
  {
    "title": "Miami node unreachable",
    "region": "miami",
    "status": "resolved",
    "started": "2026-10-08T21:00:00Z",
    "resolved": "2026-10-08T21:40:00Z",
    "updates": [
      { "at": "2026-10-08T21:40:00Z", "text": "Back up. The upstream provider replaced a failed switch." },
      { "at": "2026-10-08T21:05:00Z", "text": "Miami is down. We're on it with the datacentre." }
    ]
  }
]
```

- `status`: `investigating`, `monitoring`, or `resolved`. Anything not
  resolved shows as an active incident at the top of the page.
- `region`: optional. `dallas`, `ashburn`, `miami`, `salt-lake-city`,
  `panel`, or `billing`. Leave it out for something site-wide.
- `resolved`: leave it out (or `null`) while it's ongoing.
- Times are UTC with a `Z` on the end. The page shows them in the reader's
  own timezone.
- `updates`: newest first, plain text. No HTML, it's shown as text.

If the JSON is broken (a missing comma, usually), the page skips the
incident list and says so rather than showing nothing. github.com's editor
highlights the mistake.
