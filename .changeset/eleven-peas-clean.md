---
"@open-pioneer/map": minor
---

Introduce union types and `type` attributes for layers. This allows TypeScript narrowing for layers and determining a layer's type.

The `Layer` and `Sublayer` types for layers remain, but are unions of the corresponding concrete layer types now.
The layer type `LayerBase` has been removed and is replaced by `AnyLayerType`
to clarify that this type represents a union of all types of layer (currently `Layer` and `Sublayer`).

Two type guards have been implemented that allow to check if a layer instance is a `Layer` or `Sublayer`: `isLayer()`and `isSublayer()` (see example below).

The following `type` attribute values have been implemented at the layers:

-   SimpleLayer: `simple`
-   WMSLayer: `wms`
-   WMSSubLayer: `wms-sublayer`
-   WMTSLayer: `wmts`

Example of usage:

```ts
import { AnyLayer, WMTSLayer, isSublayer } from "@open-pioneer/map";

export class ExampleClass {
    //...

    exampleFunction(layer: AnyLayer) {
        // prop may be a layer of any type

        // use layers type attribute to check layer type
        if (layer.type === "wmts") {
            layer.matrixSet; // prop only available on WMTSLayer

            const wmtsLayer: WMTSLayer = layer; // type of layer is now narrowed to `WMTSLayer`
        }

        // use new type guard to check if layer is a Sublayer
        if (isSublayer(layer)) {
            // type of layer is now narrowed to `WMSSublayer` (as it is currently the only type of Sublayer existing)
            layer.parentLayer; // prop only available on Sublayers
        }
    }
}
```
