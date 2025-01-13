---
"@open-pioneer/map": minor
---

Add option to retrieve child layers from `LayerCollection` in `@open-pioneer/map`

Introduce option `includeChildLayers` for `getOperationLayers` and `getAllLayers` to optionally include (nested) children (sublayers and layers in groups) in the returned list of layers. If `includeChildLayers` is `true`, `getOperationLayers` and `getAllLayers` will return `AnyLayer[]` instead of `Layer[]`. By default `includeChildLayers` is `false` to avoid breaking changes.  
The option `includeChildLayers` might be costly if the hierarchy of layers is deeply nested because the layer tree has to be traversed recursively.

Example:
```typescript
const topLvlLayers : Layer[] = mapModel.map.layers.getAllLayers({
    sortByDisplayOrder: true
}); //return type is Layer[]
const allLayers : AnyLayer[] = mapModel.map.layers.getAllLayers({
    includeChildLayers: true,
    sortByDisplayOrder: true
}); //return type is AnyLayer[]

const topLvlOpLayers : Layer[] = mapModel.map.layers.getOperationalLayers({
    sortByDisplayOrder: true
}); //return type is Layer[]
const allOpLayers : AnyLayer[] = mapModel.map.layers.getOperationalLayers({
    includeChildLayers: true,
    sortByDisplayOrder: true
}); //return type is AnyLayer[]
```
