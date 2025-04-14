---
"@open-pioneer/map": patch
---

Top level operational layers can now be inserted at an arbitrary position.

```ts
const mapModel = ...;
const newLayer = new SimpleLayer({
    title: "New layer",
    // ...
});

mapModel.layers.addLayer(newLayer, { at: "top" }); // Same as default: on top of all existing operational layers
mapModel.layers.addLayer(newLayer, { at: "bottom" }); // Below all other operational layers

const otherLayer = ...; // Eiter a valid layer id or a layer instance. Must be from the same collection.
mapModel.layers.addLayer(newLayer, { at: "above", reference: otherLayer }); // Above the reference layer
mapModel.layers.addLayer(newLayer, { at: "below", reference: otherLayer }); // Below the reference layer
```
