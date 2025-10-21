---
"@open-pioneer/map": major
---

**Breaking**: Internal layers are no longer returned from getters such as `getItems()` or `getRecursiveLayers()` by default.

A new option `includeInternalLayers` has been implemented to opt-in into internal layers.
By default, internal layers are not returned by functions like `getItems()` or `getRecursiveLayers()`.
If internal layer should be returned this must be specified explicitly with the `includeInternalLayers` option.

```js
import { MapModel } from "@open-pioneer/map";

//internal layers are not included
const layers = myMapModel.layers.getItems();
//include internal layers
const allLayers = myMapModel.layers.getItems({ includeInternalLayers: true });
```

Note that if internal layers are returned this includes system layers (e.g. for highlights or geolocation) that were not explicitly added to the map.
The described behavior is aligned for the functions `getItems()`, `getLayers()`, `getAllLayers()` and `getRecursiveLayers()` in `LayerCollection`, `WMSLayer` and `GroupLayer`.
The function `getRecursiveLayers()` does not return non-internal child layers of an internal layer.
