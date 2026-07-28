---
"@open-pioneer/map": minor
---

A layer's loadState is now a derived from three different channels:

- source — the OpenLayers source state (undefined/loading/ready/error).
- health — the result of the optional healthCheck (run once on attach).
- metadata — the result of a layer's own capabilities request (if any).

Additionally, a new property `loadError` has been added to the layer class.
