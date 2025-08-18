---
"@open-pioneer/map": patch
---

Use MapModel to create highlight layer

 - use `topmost` option to add highlight layer instead of adding layer with Ol API 
 - remove internal (but exported!) constant `TOPMOST_LAYER_Z`
