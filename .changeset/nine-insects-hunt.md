---
"@open-pioneer/map": minor
---

Introduce the `LayerFactory` service (interface `"map.LayerFactory"`).

The layer factory should be used to construct new layer instances, instead of calling the layer constructor directly.
Calling the constructor directly (e.g. `new SimpleLayer`) is deprecated (but still fully supported).

For example:

```ts
// OLD
new SimpleLayer({
    title: "OSM",
    isBaseLayer: true,
    olLayer: new TileLayer({
        source: new OSM()
    })
});
```

```ts
// NEW
const layerFactory = ...; // injected
layerFactory.create({
    type: SimpleLayer,
    title: "OSM",
    isBaseLayer: true,
    olLayer: new TileLayer({
        source: new OSM()
    })
});
```

This was done to support passing hidden dependencies from the layer factory to the layer instance (such as the `HttpService`),
without forcing the user to supply these dependencies manually.

The `MapConfigProvider` has been updated as well.
The `getMapConfig` method will now receive the layer factory as an option.
This makes it easy to migrate to the new API:

```diff
# Example MapConfigProvider
export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

-   async getMapConfig(): Promise<MapConfig> {
+   async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            layers: [
-               new SimpleLayer({
+               layerFactory.create({
+                   type: SimpleLayer,
                    title: "OSM",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                })
            ]
        };
    }
}
```
