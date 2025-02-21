---
"@open-pioneer/map": minor
---

Deprecate `mapModel.layers.getAllLayers()`.
Use `mapModel.layers.getLayers()` instead.
The name of `getAllLayers()` is misleading because it does not recurse into nested layers.
