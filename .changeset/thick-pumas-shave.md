---
"@open-pioneer/map": patch
---

Use the exact inches per meter factor (`1000 / 25.4`) when converting between scale and resolution, as OpenLayers does.
Computed scale values previously used the rounded value `39.37` and may now differ by about 0.002%.
