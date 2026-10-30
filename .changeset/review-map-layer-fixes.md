---
"@open-pioneer/map": patch
---

Fix several small problems in the layer classes:

- `WMSLayer` no longer fails to initialize when the root layer of the service capabilities has a `Name` and no child layers.
  The legend URL of such a root layer is now found as well.
- A `minZoom`, `maxZoom`, `minResolution` or `maxResolution` of `0` in the layer config is now applied to the OpenLayers layer.
- `WMSLayer` and `WMTSLayer` no longer log an error when they are destroyed before their capabilities request has completed.
