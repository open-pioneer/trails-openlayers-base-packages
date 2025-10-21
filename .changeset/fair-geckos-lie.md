---
"@open-pioneer/geolocation": patch
"@open-pioneer/editing": patch
"@open-pioneer/measurement": patch
"@open-pioneer/map": patch
---

The highlight layer(s) created by this package now uses the map model's `topmost` option to register an (internal) layer.
The previous implementation was based on adding a "raw" OpenLayers layer to the `olMap`.
