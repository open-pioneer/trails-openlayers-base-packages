---
"@open-pioneer/toc": minor
---

Layers that are marked as `internal` are not considered by the Toc.

```typescript
//internal layer will not be displayed in the Toc
const internalLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    internal: true
});
```

The layer's `internal` state does also affect other UI widgets (e.g. Legend). If the layer should be hidden specifically in the Toc (but not in other widgets) the `listMode` attribute can be used to hide the layer item.

```typescript
//use listMode to hide the layer specifically in Toc
const hiddenLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    attributes: {
        toc: {
            listMode: "hide"
        }
    }
});
```

Valid values for `listMode` are:

- `"show"` layer item is displayed in Toc
- `"hide"` layer item is not rendered in Toc
- `"hide-children"` layer item for the layer itself is displayed in Toc but no layer items for child layers (e.g. sublayers of a group) are rendered

The `listMode` does always have precedences over the layer's `internal` property. For example, if the `listMode` is `"show"` the layer item is displayed even if `internal` is `true`.
