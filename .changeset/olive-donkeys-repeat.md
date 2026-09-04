---
"@open-pioneer/map": patch
---

Fix `mapModel.setScale()` for projections that do not use meters as their unit (e.g. `EPSG:4326`).

`setScale()` derived the new resolution from the projection's _nominal_ `metersPerUnit` (its value at the
equator) instead of the point resolution at the map's center. For projections in degrees the resulting
scale was therefore too small, and increasingly so towards the poles.

This could be observed in the scale setter: a different scale then the user originally selected was shown after the selection completed.
`setScale()` and `mapModel.scale` should now be consistent for every projection.
