---
"@open-pioneer/map": minor
---

Introduce new property to make retrieval of internal (child) layers optional.

By default, internal layers are not returned by functions like `getItems()` or `getRecursiveLayers()`.
If internal layer should by returned this must be explicitly specified with the `includeInternalLayers` option.

```js
import { MapModel } from "@open-pioneer/map";

//internal layers are not included
const layers = myMapModel.layers.getItems();
//include internal layers
const allLayers = myMapModel.layers.getItems({ includeInternalLayers: true });
```

Note that if internal layers are returned this includes system layers  (e.g. for highlights or geolocation) that were not explicitly added to the map as well.
The described behavior is aligned for the functions `getItems()`, `getLayers()`, `getAllLayers()` and `getRecursiveLayers()` in `LayerCollection`, `WMSLayer` and `GroupLayer`.
The function `getRecursiveLayers()` does not return non-internal child layers of an internal layer.
