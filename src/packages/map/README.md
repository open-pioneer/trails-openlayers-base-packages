# @open-pioneer/map

This package provides a map container component to integrate an [OpenLayers](https://openlayers.org/) map into an Open Pioneer Trails project.
Besides the component, the package provides a service, which handles the registration and creation of a map.

## Usage

To use the map in your app, follow these two steps:

-   Add a `MapContainer` component to your app (see [Map container component](#md:map-container-component)).
-   Implement a `MapConfigProvider` (see [Map configuration](#md:map-configuration)).

> IMPORTANT: The package uses a map model and layer model to internally handle the states of the map and layers. This is needed to support additional features like base layers.
> For this reason, always use the methods provided by these models to manage the following features on map and layers (instead of using the raw OpenLayers instances directly):
>
> -   Map composition (access and configuration of layers, base layers, removing layers)
> -   Layer visibility
> -   Custom layer metadata (`attributes`)
>
> You can use the raw OpenLayers instances for other features (for example to control the transparency of a layer).
>
> For examples, see [Using the map model](#md:using-the-map-model).

### Map container component

To integrate a `MapContainer` in an app, add the component to your React component, where you want the map to appear.
On the component specify the `mapId` of the map that you want to add.

Make sure that the parent component has an appropriate width and height (for example `100%`).
The `MapContainer` fills the entire available space.

Example: Integration of a map container with a given map ID:

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

> NOTE: There must be a `map.MapConfigProvider` that knows how to construct the map with the given ID (see [Map configuration](#md:map-configuration)).

The component itself uses the map registry service to create the map using the provided `mapId`.

### Map anchor component

To pass custom React components onto the map, the following anchor-points are provided:

-   `top-left`
-   `top-right`
-   `bottom-left`
-   `bottom-right`

Example: Integration of a map anchor component into the map container with position `bottom-right` and optional horizontal and vertical gap:

```jsx
<MapContainer mapId="...">
    <MapAnchor position="bottom-right" horizontalGap={25} verticalGap={25}>
        ... {/** add map anchor content like other React components */}
    </MapAnchor>
</MapContainer>
```

The component itself calculates the `maxHeight` and `maxWidth` according to the map view padding and optional `horizontalGap`and `verticalGap` to avoid content overflow.
In this case, the CSS property `overflow` is set to `hidden` to the map anchor component.
If no `verticalGap` is configured, a default vertical gap of `30px` is used.

> NOTE: To get the correct tab order, add the container anchor-points before other components.

### Map configuration

Register a service providing `map.MapConfigProvider` to configure the contents of a map.
Such a provider is typically located in an app.

Example: Configuration to register a service providing `map.MapConfigProvider`.

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
The following map options are supported:

-   `initialView`,
-   `projection`,
-   `layers` (see [Layer configuration](#md:layer-configuration)),
-   `advanced`

Always use the provided map model to access the map initially.
Use `.olMap` only, when the raw instance is required.

If an advanced configuration (fully constructed `OlView` instance) is used, some options (such as `initialView` or `projection`) cannot be applied anymore.

Example: Implementation of the service with `initialView.kind = position`.

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";

export class MapConfigProviderImpl implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 847541, y: 6793584 },
                zoom: 14
            },
            projection: "EPSG:3857",
            layers: [
                // ...
            ]
        };
    }
}
```

Example: Implementation of the service with `initialView.kind = extent`.

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";

export class MapConfigProviderImpl implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "extent",
                extent: {
                    xMin: 577252,
                    yMin: 6026906,
                    xMax: 1790460,
                    yMax: 7318386
                }
            },
            projection: "EPSG:3857",
            layers: [
                // ...
            ]
        };
    }
}
```

Example: Implementation of the service with an advanced configuration.

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";

export class MapConfigProviderImpl implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            advanced: {
                view: new View({
                    center: [405948.17, 5757572.85],
                    zoom: 5
                })
            },
            layers: [
                // ...
            ]
        };
    }
}
```

> IMPORTANT: Not all OpenLayers [View](https://openlayers.org/en/latest/apidoc/module-ol_View-View.html) properties are supported.
> For example, you cannot set the target because the target is controlled by the `<MapContainer />`.

#### Layer configuration

Configure your custom layer inside the [Map configuration](#md:map-configuration) by using the OpenLayers [`Layer`](https://openlayers.org/en/latest/apidoc/module-ol_layer_Layer-Layer.html) as `layer` property.

Always use the provided layer model to access the layer initially.
Use `.olLayer` only, when the raw instance is required, for example to set the opacity.

To access specific layers use the Layer Collection methods, such as `getAllLayers`, `getBaseLayers`, `getOperationalLayers`.
Layers should not be manually removed from the map via `.olMap`.
Only use `removeLayerById` to remove a layer.

Example: Implementation of a layer configuration.

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import BkgTopPlusOpen from "@open-pioneer/map/BkgTopPlusOpen";

export class MapConfigProviderImpl implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            layers: [
                {
                    // minimal layer configuration
                    title: "OSM",
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    // layer configuration with optional properties
                    id: "abe0e3f8-0ba2-409c-b6b4-9d8429c732e3",
                    title: "OSM with UUID",
                    layer: new TileLayer({
                        source: new OSM()
                    }),
                    attributes: {
                        foo: "bar"
                    },
                    description: "additional description",
                    isBaseLayer: false,
                    visible: false
                }
            ]
        };
    }
}
```

Based on the example above, you can set different properties using the layer model API (such as setting visibility, update custom metadata (`attributes`)).

Example: How to set different properties.

```js
import { useMapModel } from "@open-pioneer/map";

const { map } = useMapModel(mapId);
const layer = map.layers.getLayerById("abe0e3f8-0ba2-409c-b6b4-9d8429c732e3");

layer.setDescription("new description");
layer.setTitle("new title");
layer.setVisible(true);
layer.updateAttributes({
    foo: "baz"
});
layer.deleteAttribute("foo");
```

> NOTE: The visibility of base layers cannot be changed through the method `setVisible`.
> Call `activateBaseLayer` instead.

#### Register additional projections

OpenLayers supports only two projections by default: `EPSG:4326` and `EPSG:3857`.
To register additional projections to use them for the map, use the `registerProjections` function.

Example: How to register an additional projection to the global [proj4js](https://github.com/proj4js/proj4js) definition set by name (such as `"EPSG:4326"`) and projection definition (string defining the projection or an existing proj4 definition object):

```ts
import { registerProjections } from "@open-pioneer/map";

registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    // ... more projections
});
```

Projection definitions can be accessed by the [epsg.io](https://epsg.io/) website or by searching the global [proj4js](https://github.com/proj4js/proj4js) definition set with a valid name.

Example: How to use the registered projection:

```ts
import { getProjection } from "@open-pioneer/map";

// Returns a raw proj4 projection definition (or undefined)
const proj = getProjection("EPSG:3035");

// proj can be used as "projection" in "getMapConfig" of MapConfigProvider implementation
```

### Using the map model

The package uses a map model and layer model to internally handle the states of the map and layers.
This is needed to support additional features like base layers.
For this reason, always use the methods provided by these models to manage the following features on maps and layers (instead of using the raw OpenLayers instances directly):

-   Map composition (access and configuration of layers, base layers, removing layers)
-   Layer visibility
-   Custom layer metadata (`attributes`)

You can use the raw OpenLayers instances for other features (for example to control the transparency of a layer).

#### Using the map model and layer model in services

Example: Center map to given coordinates using the map model and set layer visibility using the layer model.

```ts
import { ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import { MAP_ID } from "./MapConfigProviderImpl";
import type { MapRegistry } from "@open-pioneer/map";

interface References {
    mapRegistry: ServiceType<"map.MapRegistry">;
}

export class TestService {
    private registry: MapRegistry;

    constructor(options: ServiceOptions<References>) {
        this.registry = options.references.mapRegistry;
    }

    async centerBerlin() {
        const model = await this.registry.getMapModel(MAP_ID);
        model?.olMap?.getView().fit([1489200, 6894026, 1489200, 6894026], { maxZoom: 13 });
    }

    async setLayerVisible() {
        const model = await this.registry.getMapModel(MAP_ID);
        const layer = model?.layers.getLayerById("abe0e3f8-0ba2-409c-b6b4-9d8429c732e3");
        layer?.setVisible(true);
    }
}
```

#### Using the map model in React components

To access the map model instance, use the React hook `useMapModel`.

Example: Center map to given coordinates using the map model.

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
            olMap?.getView().fit([1489200, 6894026, 1489200, 6894026], { maxZoom: 13 });
        }
    };
}
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
