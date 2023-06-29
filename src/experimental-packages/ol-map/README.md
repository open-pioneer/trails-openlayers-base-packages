# @open-pioneer/experimental-ol-map

This package provides a map container component to integrate an [OpenLayers](https://openlayers.org/) map into an open pioneer project.
Besides the component, there is a service, which handles the registration and creation of a map.

## Usage

### Map container component

To integrate a `MapContainer` in a React template, place it at the point where it should appear.
The parent component should provide appropriate width and height (e.g. `100%`).
The `MapContainer` will fill all available space.

The component itself uses the map registry service to create the map on demand using the provided `mapId`.

Simple integration of a map container with a map id:

```jsx
import { Box } from "@open-pioneer/chakra-integration";
import { MapContainer } from "@open-pioneer/experimental-ol-map";

//...

<Box height="100%" overflow="hidden">
    <MapContainer mapId="..." />
</Box>;
```

> NOTE: There must be a `ol-map.MapConfigProvider` present that knows how to construct the map with the given id (see below).

### Configuring the map

Register a service implementing `ol-map.MapConfigProvider` to configure the contents of your map(s).
Such a provider is typically located in an app.

When a map with a certain `mapId` is requested, the `MapRegistry` will invoke the appropriate config provider to provide the map's contents.

This example provides the map `main`:

```js
// YOUR-APP/build.config.mjs
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        MainMapProvider: {
            // Registers the service as a config provider
            provides: ["ol-map.MapConfigProvider"]
        }
    }
});
```

```ts
// YOUR-APP/services.ts
import { OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map/api";
import { Attribution } from "ol/control";
import TileLayer from "ol/layer/Tile";
import { MapOptions } from "ol/Map";
import OSM from "ol/source/OSM";
import View from "ol/View";

export class MainMapProvider implements OlMapConfigurationProvider {
    // Declares the map id supported by this provider.
    mapId = "main";

    // Called by the registry (once) to construct the map.
    async getMapOptions(): Promise<MapOptions> {
        return {
            view: new View({
                projection: "EPSG:3857",
                center: [847541, 6793584],
                zoom: 14
            }),
            layers: [
                new TileLayer({
                    source: new OSM(),
                    properties: { title: "OSM" }
                })
            ],
            controls: [new Attribution()]
        };
    }
}
```

### Map registry service

The service is registered with the name `"ol-map.MapRegistry"`.
By injecting it in the common way, you can access a map via the following snippet:

```ts
// get open layers map registry
const olMapRegistry = ...; // injected
const olMap = await olMapRegistry.getMap(MAP_ID);
```

Or, from React code with the `useMap()` helper hook:

```js
import { useMap } from "@open-pioneer/experimental-ol-map";

function MyComponent({ mapId }) {
    const { loading, map, error } = useMap(mapId);
}
```

> NOTE: There must be a `ol-map.MapConfigProvider` present that knows how to construct the map with the given id (see below).

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
