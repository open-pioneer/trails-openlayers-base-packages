---
"@open-pioneer/map-test-utils": minor
"@open-pioneer/map": minor
---

Add new properties for topmost layers and base layers in `MapConfig`.

- With `MapConfig.topmostLayers` topmost layers can now be defined in the initial map setup.
- Base layers can now be defined in the initial map setup with the `MapConfig.baseLayers` property

We recommend using the `baseLayers` property instead of `isBaseLayer: true` for new apps.

```typescript
export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {...},
            projection: "EPSG:25832",
            baseLayers: [
                //all base layers
                layerFactory.create(...)
            ],
            layers: [
                //all other operational layers
                layerFactory.create(...),
                layerFactory.create(...)
            ],
            topmostLayers: [
                //all operational highlight layers
                layerFactory.create(...)
            ]
        };
    }
}
```
