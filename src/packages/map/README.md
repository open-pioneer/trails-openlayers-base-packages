# @open-pioneer/map

This package provides a map container component to integrate an [OpenLayers](https://openlayers.org/) map into an open pioneer project. Besides the component, there is a service, which handles the registration and creation of a map.

## Usage

### Map container component

To integrate a `MapContainer` in a React template, place it at the point where it should appear.
The parent component should provide appropriate width and height (e.g. `100%`).
The `MapContainer` will fill all available space.

The component itself uses the map registry service to create the map on demand using the provided `mapId`.

Simple integration of a map container with a map id:

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

> NOTE: There must be a `ol-map.MapConfigProvider` present that knows how to construct the map with the given id (see below).

### Configuring the map

Register a service implementing `ol-map.MapConfigProvider` to configure the contents of your map(s). Such a provider is typically located in an app.

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
                kind: "position",
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

Simple example to register a additional projection to the global [proj4js](https://github.com/proj4js/proj4js) definition set by there name (e.g. `"EPSG:4326"`) and projection definition (string defining the projection or an existing proj4 definition object).

```ts
import { registerProjections } from "@open-pioneer/map";

registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    // ... more projections
});
```

Get the projection definition by access the epsg.io Website or search the global [proj4js](https://github.com/proj4js/proj4js) definition set with a valid name.

```ts
import { getProjection } from "@open-pioneer/map";

// Returns a raw proj4 projection definition (or undefined)
const proj = getProjection("EPSG:3035");
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
