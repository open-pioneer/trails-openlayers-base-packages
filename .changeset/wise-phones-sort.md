---
"@open-pioneer/map-test-utils": minor
"@open-pioneer/map": minor
---

Add separate properties for Topmost Layers and Base Layers in MapConfig

- With `MapConfig.topmostLayers` topmost layers can now be defined in the initial map setup.
- Base layers can now be defined in the initial map setup with the `MapConfig.baseLayers` property

```Typescript
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
            topmostLayers: [
                //all operational highlight layers
                layerFactory.create(...)
            ],
            layers: [
                //all other operational layers
                layerFactory.create(...),
                layerFactory.create(...)
            ]
        };
    }
}
```

Currently, The property `LayerConfig.isBaseLayer` can still be used but using the new property `MapConfig.baseLayers` (as in the example above) should be preferred.
