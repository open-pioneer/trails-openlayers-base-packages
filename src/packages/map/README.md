# @open-pioneer/map

This package provides a map container component to integrate an [OpenLayers](https://openlayers.org/) map into an open pioneer trails project. Besides the component, the package provides a service, which handles the registration and creation of a map.

## Usage

To use the map in your app, two things need to be done:

-   Add MapContainer component to your app (see [Map container component](#markdown-header-map-container-component))
-   Implement a MapConfigProvider (see [Configuring the map](#markdown-header-configuring-the-map))

### Map container component

To integrate a `MapContainer` in an app, add the component to your React component, where you want to map to appear. On the component specify the `mapId` of the map, you want to add.

The parent component should provide appropriate width and height (e.g. `100%`).
The `MapContainer` will fill all available space.

Example: Simple integration of a map container with a given map id:

```jsx
import { Box } from "@open-pioneer/chakra-integration";
import { MapContainer } from "@open-pioneer/map";

// ...
function AppUI() {
    return (
        <Box height="100%" overflow="hidden">
            <MapContainer mapId="..." />
        </Box>
    );
}
```

> NOTE: There must be a `map.MapConfigProvider` present that knows how to construct the map with the given id (see below).

The component itself uses the map registry service to create the map using the provided `mapId`.

### Configuring the map

Register a service providing `map.MapConfigProvider` to configure the contents of a map. Such a provider is typically located in an app.

```js
// YOUR-APP/build.config.mjs
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        MapConfigProviderImpl: {
            // Registers the service as a config provider
            provides: ["map.MapConfigProvider"]
        }
    },
    ui: {
        references: ["map.MapRegistry"]
    }
});
```

The service itself needs to implement the `MapConfigProvider` interface.

Example implementation of the service:

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position", // or "extent" to configure the initial extent
                center: { x: 847541, y: 6793584 },
                zoom: 14
            },
            projection: "EPSG:3857",
            layers: [
                {
                    title: "OSM",
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    title: "Watercolor",
                    visible: false,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "watercolor" })
                    })
                },
                {
                    title: "Toner",
                    visible: false,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "toner" })
                    })
                }
            ]
        };
    }
}
```

### Use map model in react component

```js
import { useMapModel } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    // mapState.map may be undefined initially, if the map is still configuring.
    // the object may may also be in an "error" state.
    const mapState = useMapModel(MAP_ID);

    const centerBerlin = () => {
        const olMap = mapState.map?.olMap;
        if (olMap) {
            olMap?.getView().fit(berlin, { maxZoom: 13 });
        }
    };
}
```

### Register additional projections

OpenLayers supports only two projections by default: EPSG:4326 and EPSG:3857. However, it is possible to register additional projections to use them for the map.

Fot that, the `registerProjections` function can be used.

Simple example to register an additional projection to the global [proj4js](https://github.com/proj4js/proj4js) definition set by name (e.g. `"EPSG:4326"`) and projection definition (string defining the projection or an existing proj4 definition object):

```ts
import { registerProjections } from "@open-pioneer/map";

registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    // ... more projections
});
```

Projection definitions can be accessed by the [epsg.io](https://epsg.io/) website or by searching the global [proj4js](https://github.com/proj4js/proj4js) definition set with a valid name.

The following example shows, how to use the registered projection:

```ts
import { getProjection } from "@open-pioneer/map";

// Returns a raw proj4 projection definition (or undefined)
const proj = getProjection("EPSG:3035");

// proj can be used as "projection" in "getMapConfig" of MapConfigProvider implementation
```

## Notes

-   Always use new API to access the map initially
    -   Use `.olMap` (or `.olLayer`) when the raw instance is required
-   Use the model classes to manage:
    -   Map composition (access and configuration of layers, base layers)
    -   Layer visibility
    -   Custom layer metadata (`attributes`)
-   Use the raw ol instances for other features (e.g. opacity)

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
