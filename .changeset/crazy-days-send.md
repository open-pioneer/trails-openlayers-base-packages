---
"@open-pioneer/map": minor
---

Support buffer for zoom geometries.
Use the `buffer` option to specify the size increase. E.g. `0.1` for 10% size increase.

We use the already existing `calculateBufferedExtent` function to compute the buffer.

For example:

```ts
const map: MapModel = ...;
const highlight = map.highlightAndZoom(someGeometries, {
    // Grows extent by 10%
    buffer: 0.1
});
```
