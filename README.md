# aya04la.github.io

My portfolio: five systems projects, each tested against the ways it fails.

**Live → https://aya04la.github.io**

| Project | What it shows |
|---|---|
| [Systems, Visualized](https://github.com/Aya04LA/systems-visualized) ([live](https://aya04la.github.io/systems-visualized/)) | Raft consensus with live safety checks, fuzz and mutation tested; consistent hashing |
| [Dispatch](https://github.com/Aya04LA/job-queue) | Postgres job queue: SKIP LOCKED, leases, fencing, dead-letter queue, kill-a-worker dashboard |
| [Canvas](https://github.com/Aya04LA/whiteboard) | Collaborative whiteboard on a hand-written CRDT, offline merge, multi-instance |
| [Snip](https://github.com/Aya04LA/url-shortener) | URL shortener: one-round-trip redirects, async analytics via Redis Streams |
| [Rate Limiter Lab](https://github.com/Aya04LA/ratelimiter-lab) | Four rate-limiting algorithms on atomic Redis scripts |

The site is plain HTML, CSS and JavaScript with no build step. Project content lives in `js/projects.js`; every figure in it was measured on the real code.

Run locally: `python -m http.server` and open http://localhost:8000.