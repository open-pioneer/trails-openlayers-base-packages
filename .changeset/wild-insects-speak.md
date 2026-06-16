---
"@open-pioneer/map": minor
"@open-pioneer/toc": minor
---

loadState is now a combined state derived from three independent channels:

- source — the OpenLayers source state (undefined/loading/ready/error).
- health — the result of the optional healthCheck (run once on attach).
- metadata — the lifecycle of a layer's own capabilities request.
- Combination follows a fixed priority: error > loading > not-loaded > loaded.

- WMS capabilities are now validated: a configured sublayer name that does not exist in the service's capabilities is visible in the parent layer.
- New hooks useAggregatedLoadState / useAggregatedError: a group layer reflects the state of the sublayer
- Problem indicators distinguish a layer's own error (red, checkbox disabled) from a child error bubbling up to a group (orange, group checkbox stays enabled so it can still be toggled). Error details appended to the indicator label and tooltip.
