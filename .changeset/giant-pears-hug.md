---
"@open-pioneer/toc": patch
---

The implementation now uses the map model's `includeInternalLayers === true` option to retrieve layers.
Internal layers are not shown by default, unless their `listMode` is configured.
