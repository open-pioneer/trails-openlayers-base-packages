---
"@open-pioneer/map": patch
---

Fix `calculateBufferedExtent()` (and therefore `mapModel.zoom()` with a buffer).
The internal width and height calculations where swapped.
