---
"@open-pioneer/map": patch
---

The internal constant `TOPMOST_LAYER_Z` has been removed.
To configure a layer that is always on top:

- Create a layer using the `LayerFactory`
- Add it to the map model and specify the `at: "topmost"` option
