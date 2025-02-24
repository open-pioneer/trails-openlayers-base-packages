---
"@open-pioneer/map": minor
---

improve scale calculation for none-metric projections

Fix scale calculation for projections with none-metric units (e.g. EPSG:4326).  
Note: The calculated scale (`useScale`) still may deviate from the desired scale (`setScale`) for non-metric projections. This is due to limitiations in the [getPointResolution](https://openlayers.org/en/latest/apidoc/module-ol_proj.html#.getPointResolution) function from OL.
