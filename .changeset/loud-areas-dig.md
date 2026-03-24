---
"@open-pioneer/map": minor
---

MapModel: implement new `loading` property.
This property is `true` if the map is currently loading any resources, `false` otherwise.
The property is based on OpenLayers `loadstart` and `loadend` events (see [Documentation](https://openlayers.org/en/latest/apidoc/module-ol_MapEvent-MapEvent.html#event:loadstart)).
