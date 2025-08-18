---
"@open-pioneer/map": minor
---

Add new `"topmost"` option to add layers that are always displayed on the top (above all other layers).

A new layers can be added at `topmost` to ensure that this layer will always be displayed on top of the other layers.
This can be used, for example, to implement highlights or to draw graphics.
Layers added at `"topmost"` will always be shown above layers at `"top"`.

When using the `"above"` or `"below"` options with a `"topmost"` reference layer, that layer becomes `"topmost"` as well.

```typescript
import { MapModel, SimpleLayer } from "@open-pioneer/map";

const highlightLayer = new SimpleLayer({
    title: "highlights",
    olLayer: myOlLayer
});
//always displayed at the top
myMapModel.layers.addLayer(highlightLayer, { at: "topmost" });
```
