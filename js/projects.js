// The work, as data. Every figure here was measured on the real code
// (tests, browser runs, CI). Nothing estimated.
export const projects = [
  {
    id: "systems-visualized",
    name: "Systems, Visualized",
    kind: "Raft consensus · Consistent hashing",
    tagline: "Distributed-systems algorithms you can break on purpose, with live safety checks.",
    tags: ["Raft", "Fuzz testing", "Mutation testing", "Simulation", "SVG"],
    stats: [
      { value: "150", label: "random crash and partition schedules, all safety properties hold" },
      { value: "18.6% vs 80.3%", label: "keys moved by adding a server: hash ring vs hash % N" },
    ],
    links: { live: "https://aya04la.github.io/systems-visualized/", code: "https://github.com/Aya04LA/systems-visualized" },
    sections: [
      ["What it is", [
        "An interactive Raft cluster: crash servers, split the network, send writes, and watch elections, replication and commitment message by message.",
        "A consistent-hashing lab that counts how many keys move when a server joins or leaves, next to naive modulo hashing.",
      ]],
      ["How it works", [
        "Raft follows Figure 2 of the paper: randomized election timeouts, the election restriction, AppendEntries consistency checks with conflict truncation, and the current-term commit rule with a leader no-op.",
        "Everything runs as a deterministic discrete-event simulation on virtual time with a seeded PRNG, so any failure replays exactly.",
        "An invariant checker verifies election safety, log matching, leader completeness and state-machine safety continuously, in the page and in tests.",
      ]],
      ["Testing", [
        "A fuzz test throws 150 random schedules of crashes, restarts and partitions at the cluster, then checks that it recovers and applies new writes identically everywhere.",
        "A mutation test breaks the election restriction on purpose; the checker must catch it, and it finds thousands of violations.",
        "Finding: the paper's Figure 8 bug survived 1,500 hostile runs, because the leader's no-op closes the window it needs. That's why real implementations add the no-op.",
      ]],
    ],
  },
  {
    id: "dispatch",
    name: "Dispatch",
    kind: "Job queue on Postgres",
    tagline: "A background-job queue with a live dashboard where you can kill workers mid-job and watch the work recover.",
    tags: ["Postgres", "SKIP LOCKED", "Leases", "Fencing", "SSE"],
    stats: [
      { value: "140 / 140", label: "jobs completed after killing a worker holding 3 of them" },
      { value: "35", label: "tests, run on SQLite and real Postgres in CI" },
    ],
    links: { code: "https://github.com/Aya04LA/job-queue" },
    sections: [
      ["What it is", [
        "A job queue built only on Postgres: no Redis, no broker. Jobs can be enqueued in the same transaction as the data that caused them.",
        "A dashboard streams live state over server-sent events: throughput, workers with their busy slots, a job feed and a dead-letter queue.",
      ]],
      ["How it works", [
        "Workers claim with UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED), so many workers claim at once without blocking or double-claiming.",
        "Claimed jobs are leased. Workers renew while busy; a reaper returns expired leases to the queue, and the crashed attempt still counts toward max attempts.",
        "Every worker write is fenced by job, worker and attempt number, so a stalled zombie worker can't overwrite a newer attempt.",
        "Exponential backoff with jitter, a dead-letter queue with retry, idempotency keys, backpressure (503 when full), and LISTEN/NOTIFY wake-ups across processes.",
      ]],
      ["Testing", [
        "Real-time worker tests: kill a worker and another finishes its job; steal a lease and the running handler is cancelled; drain finishes in-flight work.",
        "Testing found a shutdown hang that appeared in about one run in five. Fixed, then verified with 12 consecutive clean runs.",
      ]],
    ],
  },
  {
    id: "canvas",
    name: "Canvas",
    kind: "Collaborative whiteboard",
    tagline: "A real-time multiplayer whiteboard on a CRDT I wrote, so it keeps working offline and merges when you reconnect.",
    tags: ["CRDT", "Hybrid logical clocks", "WebSockets", "Redis pub/sub", "Offline-first"],
    stats: [
      { value: "200", label: "random edit histories, all converge whatever the delivery order" },
      { value: "Identical", label: "state in two tabs after conflicting offline edits" },
    ],
    links: { code: "https://github.com/Aya04LA/whiteboard" },
    sections: [
      ["What it is", [
        "Share a link and draw together with live cursors. Go offline in one tab, keep drawing in both, reconnect, and both converge with nothing lost.",
      ]],
      ["How it works", [
        "Each shape is a map of last-writer-wins fields ordered by hybrid logical clocks. Merge is a per-field max: commutative, associative and idempotent.",
        "The same rules are implemented in Python on the server and JavaScript in the browser, checked against one shared fixture file.",
        "Rooms span server instances over Redis pub/sub with no sticky sessions; persistence is an op log plus snapshots that needs no locking.",
        "Edits are never dropped: slow clients are disconnected and resync from a snapshot. Timestamps far in the future are rejected so one skewed clock can't win every conflict.",
      ]],
      ["Testing", [
        "286 Python tests (CRDT properties, rooms across two instances, WebSockets end to end, Redis compaction) and the JS suite in CI.",
        "Tests caught a real bug: a new instance never learned about people already connected through another, so it now asks “who's here?” when it opens a room.",
      ]],
    ],
  },
  {
    id: "snip",
    name: "Snip",
    kind: "URL shortener",
    tagline: "A URL shortener where a redirect costs one Redis round trip, while every click is still counted.",
    tags: ["Redis Lua", "Redis Streams", "Caching", "Feistel cipher", "Postgres"],
    stats: [
      { value: "0.24 ms", label: "cache-hit redirect vs 13.5 ms for a database miss (local run)" },
      { value: "70", label: "tests across both store backends; CI on real Redis and Postgres" },
    ],
    links: { code: "https://github.com/Aya04LA/url-shortener" },
    sections: [
      ["What it is", [
        "Shorten a link, share it, and watch live stats. An “under the hood” panel shows the cache hit rate and the click queue as you use it.",
      ]],
      ["How it works", [
        "One Lua script reads the cached link and appends the click to a Redis Stream atomically, so a redirect never waits on the database.",
        "A worker drains the stream through a consumer group in batches: 50 clicks on one link in one minute become a single upsert.",
        "Short codes are the database id through a keyed Feistel permutation: unique without collision checks, and not guessable by counting.",
        "Negative caching for unknown codes, explicit invalidation on delete and alias creation, and redirects that keep working from Postgres when Redis is down.",
      ]],
      ["Testing", [
        "Swipe-to-delete, undo and the delete window were tested in the browser, along with the stats page and its keyboard access.",
        "Writing the worker tests found failed batches waiting 60 seconds to retry; workers now retry their own unacknowledged events first.",
      ]],
    ],
  },
  {
    id: "ratelimiter",
    name: "Rate Limiter Lab",
    kind: "Distributed rate limiter",
    tagline: "Four rate-limiting algorithms on atomic Redis scripts, compared side by side under the same traffic.",
    tags: ["Redis Lua", "Token bucket", "Sliding window", "FastAPI"],
    stats: [
      { value: "20 vs 10", label: "requests let through by fixed window vs sliding log in a boundary attack" },
      { value: "74", label: "tests; every algorithm checked against both backends" },
    ],
    links: { code: "https://github.com/Aya04LA/ratelimiter-lab" },
    sections: [
      ["What it is", [
        "Fixed window, sliding log, sliding window counter and token bucket, behind one API, with a page that sends identical traffic to all four.",
        "A “boundary attack” button shows fixed window letting through twice its limit while the sliding algorithms hold.",
      ]],
      ["How it works", [
        "Each check is one atomic Lua script, so there are no read-modify-write races across instances, and it's one round trip.",
        "An in-memory backend mirrors each script line for line, and every test runs on both, proving they decide identically.",
        "Standard RateLimit and Retry-After headers, a /v1/check endpoint other services call (Snip uses it), and fail-open when Redis is unreachable.",
      ]],
    ],
  },
];

export const principles = [
  ["Test the failure cases", "Crash it, partition it, kill it mid-job, then check the guarantees still hold. Every project here has tests aimed at the ways it can break."],
  ["Make it visible", "If a system's behaviour can't be seen, it can't be trusted. Each project shows its internals live: queues, caches, elections, merges."],
  ["Write down the trade-offs", "Every README explains what I chose, what it costs, and where it stops working, including the limits I hit."],
  ["Measure, don't guess", "Numbers come from real runs. Where I haven't measured something yet, I say so instead of making it up."],
];
