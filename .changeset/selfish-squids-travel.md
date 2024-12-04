---
"@open-pioneer/map": minor
---

Add new layer type `GroupLayer` to to the Map API.

A `GroupLayer` contains a list of `Layer` (e.g. `SimpleLayer` or `WMSLayer`). Because `GroupLayer` is a `Layer` as well nested groups are supported.  
The child layers of a `GroupLayer` can be accessed with the `layers` property - `layers` is `undefined` if it is not a group.
The parent `GroupLayer` of a child layer can be accessed with the `parent` property - `parent` is `undefined` if this layer is not part of a group (or not a sublayer).

```js
const olLayer1 = new TileLayer({
    source: new OSM()
});
const olLayer2 = new TileLayer({
    source: new BkgTopPlusOpen()
});

// Create group layer with nested sub group
const group = new GroupLayer({
    id: "group",
    title: "a group layer",
    layers: [
        new SimpleLayer({
            id: "member",
            title: "group member",
            olLayer: olLayer1
        }),
        new GroupLayer({
            id: "subgroup",
            title: "a nested group layer",
            layers: [
                new SimpleLayer({
                    id: "submember",
                    title: "subgroup member",
                    olLayer: olLayer2
                })
            ]
        })
    ]
});

const childLayers: GroupLayerCollection = group.layers; // Access child layers
```

Layers can only be added to a single group or map.
Sublayers (e.g. `WMSSublayer`) cannot be added to a group directly.
