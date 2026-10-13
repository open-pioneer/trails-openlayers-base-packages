---
"@open-pioneer/map": minor
---

Add the property `effectivelyVisible` to all layers.
A layer is effectively visible if it is `visible` and all its parents are also visible.
Use this property to test whether a layer is hidden by one of its parents (e.g. an invisible group layer).
