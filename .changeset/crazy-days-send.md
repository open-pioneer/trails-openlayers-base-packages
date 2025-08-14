---
"@open-pioneer/map": patch
---

Support buffer for zoom geometries.

For example:

```ts
const map: MapModel = ...;
const highlight = map.highlightAndZoom(someGeometries, {
    // Grows extent by 10%
    buffer: 0.1
});
```
