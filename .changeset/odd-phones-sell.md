---
"@open-pioneer/map": minor
---

Move highlight methods to `mapModel.highlights`.

- `mapModel.highlight()` -> `mapModel.highlights.add()`
- `mapModel.highlightAndZoom()` -> `mapModel.highlights.addAndZoom()`
- `mapModel.removeHighlights()` -> `mapModel.highlights.clear()`

The old methods on the Map Model have been deprecated and will be removed in a future major release.
