---
"@open-pioneer/map": minor
---

Add function `getRecursiveLayers()` to `LayerCollection`, `SublayerCollection` and `GroupLayerCollection` in `@open-pioneer/map`

Compared to `getLayers` and `getOperationalLayers`, `getRecursiveLayer` returns all (nested) child and sub layers of a collection.
The property `options.filter` can be used to exclude layers (and their child layers) from the result. For `LayerCollection`, `getRecursiveLayers()` provides the predefined filters `base` and `operational` to return either base layers or operation layers only.

The function might be costly if the hierarchy of layers is deeply nested because the layer tree has to be traversed recursively.
In some scenarios using `options.filter` could be used to improve the performance because it is not necessary to traverse the layer tree completely if some layers are excluded.

Example (using GroupLayerCollection):

```typescript
const grouplayer = new GroupLayer({
    id: "group",
    title: "group test",
    layers: [
        new SimpleLayer({
            id: "member",
            title: "group member",
            olLayer: olLayer1
        }),
        new GroupLayer({
            id: "subgroup",
            title: "subgroup test",
            layers: [
                new SimpleLayer({
                    id: "subgroupmember",
                    title: "subgroup member",
                    olLayer: olLayer2
                })
            ]
        })
    ]
});

// Returns only the layer "member" because the provided filter function excludes "subgroup" and (implicitly) its child "subgroupmember".
const layers = grouplayer.layers.getRecursiveLayers({
    filter: (layer) => layer.id !== "subgroup"
});
```
