---
"@open-pioneer/map": minor
---

Add the property `effectivelyVisible` to all layers.
A layer is effectively visible if it is `visible` all its parents are also visible.
Use this property to test whether a layer will actually be rendered on the screen.
