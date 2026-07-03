---
"@open-pioneer/map": minor
---

loadState is now a combined state derived from three independent channels:

- source — the OpenLayers source state (undefined/loading/ready/error).
- health — the result of the optional healthCheck (run once on attach).
- metadata — the lifecycle of a layer's own capabilities request.
- Combination follows a fixed priority: error > loading > not-loaded > loaded.
