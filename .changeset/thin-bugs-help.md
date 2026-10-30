---
"@open-pioneer/map": minor
"@open-pioneer/ogc-features": patch
"@open-pioneer/selection": patch
"@open-pioneer/printing": patch
---

Raise OL version to 10.11.0 and fix arising issues with OL's typings

- introduce new readonly property `viewport` on MapModel
    - shorthand for `mapModel.olMap.getViewport()`
- throw error if unsupported execution in a worker thread with `OffscreenCanvas` available
- use new `viewport` property in packages
