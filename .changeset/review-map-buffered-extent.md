---
"@open-pioneer/map": patch
---

`calculateBufferedExtent()` now buffers the width of the extent by its width and the height by its height.
Previously the two were swapped, so a non-square extent grew by the wrong amount in each direction.
This also affects the `buffer` option of `MapModel.zoom()` and `Highlights.addAndZoom()`.
