---
"@open-pioneer/map": minor
---

Introduce `internal` property for all layer types (including sublayers). If `internal` is `true` (default: `false`) the layer is not considered by any UI widget (e.g. legend and Toc). The `internal` state of a layer is not to be confused with the layer's visibility on the map which is determined by the `visible` property.

```typescript
//internal layer is visible on the map but hidden in UI elements like legend and Toc
const internalLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    visible: true,
    internal: true
});
```
