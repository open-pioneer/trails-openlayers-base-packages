---
"@open-pioneer/map": minor
---

Add option to add layers that are always displayed on the top

A new layers can be added at `topmost` to ensure that this layer will always be displayed on top of the other layers. For example, the `topmost` option can be used to create highlight layers.
A Layer added at `top` will never be displayed above layers added at `topmost`.
Another layer added at `topmost` will be displayed even on top of the previous layer. Both layers are still displayed above all other layers.
Layers that are added `above` or `below` a layer that was added at `topmost` will also be kept at the top as if they were added at `topmost`.


```typescript
import { MapModel, SimpleLayer } from "@open-pioneer/map";

const highlightLayer = new SimpleLayer({
    title: "highlights",
    olLayer: myOlLayer
})
//always displayed at the top
myMapModel.layers.addLayer(highlightLayer, { at: "topmost" });

const highlightLayer_below = new SimpleLayer({
    title: "lesser_highlights",
    olLayer: myOlLayer2
})
//displayed below highlightLayer but always above all other layers
myMapModel.layers.addLayer(highlightLayer_below, { at: "below", reference:  highlightLayer });
```
