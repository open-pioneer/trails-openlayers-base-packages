# @open-pioneer/map

This package integrates [OpenLayers](https://openlayers.org/) maps into a Trails application.
APIs provided by this package can be used to configure, embed and access the map and its contents.

## Usage

To use the map in your app, follow these two steps:

-   Add a `MapContainer` component to your app (see [Map container component](#md:map-container-component)).
-   Implement a `MapConfigProvider` (see [Map configuration](#md:map-configuration)).

To access or manipulate the content of the map programmatically, see [Using the map model](#using-the-map-model).

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

By default, certain pointer events from map anchor children (such as `pointer-down`) are stopped from bubbling up towards the map.
This is done to "hide" those events from map interactions (such as drawing): this makes it possible to click into text or controls within a map anchor without interacting with the map.
This behavior can be disabled by setting the `stopEvents` property to `false`:

```jsx
<MapAnchor position="top-right" stopEvents={false}>
    {/* Click events etc. will be seen by the map. This could be appropriate for non-interactive text-only overlays, for example. */}
</MapAnchor>
```

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
-   `layers` (see [Layer configuration](#layer-configuration)),
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

Configure your custom layer inside the [Map configuration](#md:map-configuration) by using one of the layer classes provided by this package.
For example, `SimpleLayer` can be used to configure an arbitrary [`OpenLayers Layer`](https://openlayers.org/en/latest/apidoc/module-ol_layer_Layer-Layer.html) as `olLayer` property.

> **Layer Order**
>
> By default, layers are displayed in the order in which they are defined in the `layers` array.
> The later a layer is listed in the array, the higher up it is displayed in the map.
>
> Base layers are excluded from this rule: they are always displayed below all operational layers.

Example: Implementation of a layer configuration.

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider, SimpleLayer } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

export class MapConfigProviderImpl implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            layers: [
                new SimpleLayer({
                    // minimal layer configuration
                    title: "OSM",
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    // layer configuration with optional properties
                    id: "abe0e3f8-0ba2-409c-b6b4-9d8429c732e3",
                    title: "OSM with UUID",
                    olLayer: new TileLayer({
                        source: new OSM()
                    }),
                    attributes: {
                        foo: "bar"
                    },
                    description: "additional description",
                    isBaseLayer: false,
                    visible: false
                })
            ]
        };
    }
}
```

Based on the example above, you can set different properties using the layer API (such as setting visibility, update custom metadata (`attributes`)).

Example: How to set different properties.

```js
import { useMapModel } from "@open-pioneer/map";

const { map } = useMapModel(mapId);
const layer = map.layers.getLayerById("abe0e3f8-0ba2-409c-b6b4-9d8429c732e3");

layer.setDescription("new description");
layer.setTitle("new title");
layer.setVisible(true);
layer.updateAttributes({
    foo: "bar"
});
layer.deleteAttribute("foo");
```

> NOTE: The visibility of base layers cannot be changed through the method `setVisible`.
> Call `activateBaseLayer` instead.

##### OGC API Features

To create an OGC API Features layer, use the `ogc-features` package.
Details about the necessary steps are described in the package's [README](../ogc-features/README.md) file.

##### Mapbox / MapLibre styles

To use layers of a Mapbox / MapLibre style document, use the class `MapboxVectorLayer` from the package `ol-mapbox-style` as in the following sample:

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapboxVectorLayer } from "ol-mapbox-style";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            projection: "EPSG:3857",
            initialView: {
                kind: "position",
                center: {
                    x: 848890,
                    y: 6793350
                },
                zoom: 13
            },
            layers: [
                {
                    title: "Abschnitte/Äste mit Unfällen (Mapbox Style)",
                    layer: new MapboxVectorLayer({
                        styleUrl: "https://demo.ldproxy.net/strassen/styles/default?f=mbs"
                    })
                }
            ]
        };
    }
}
```

Because of the changed licence of Mapbox as of version 2.0, we recommend to override the implementation with the code of MapLibre (see the main package.json of this repository for a sample).

##### OGC Web Map Tile Service (WMTS)

To create a layer configuration for a WMTS, use one of the following configuration approaches:

1. Predefine options
2. Request options from the services capabilities (see [OpenLayers API](https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS.html#.optionsFromCapabilities))

Predefining the options results in faster startup of your application and prevents the startup process from being interrupted when a service is temporarily unavailable.
Requesting the options from the capabilities has the advantage that you do not have to track and adjust changes in the services' metadata and can integrate a service with less code.

Example: How to predefine all necessary options for a WMTS layer:

```ts
// YOUR-APP/MapConfigProviderImpl.ts
export const MAP_ID = "main";

/**
 * Register custom projection to the global proj4js definitions.
 */
registerProjections({
    "EPSG:31466":
        "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=BETA2007.gsb +units=m +no_defs +type=crs"
});

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:31466",
            layers: [
                new SimpleLayer({
                    id: "topplus_open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    layer: new TileLayer({
                        source: createWMTSSource("web")
                    })
                })
            ]
        };
    }
}

function createWMTSSource(layer: "web" | "web_grau" | "web_light") {
    const topLeftCorner = [-3803165.98427299, 8805908.08284866];

    /**
     * Resolutions taken from AdV WMTS-Profil
     * @see https://www.adv-online.de/AdV-Produkte/Standards-und-Produktblaetter/AdV-Profile/
     */
    const resolutions = [
        4891.96981025128, // AdV-Level 0  (1:17471320.7508974)
        2445.98490512564, // AdV-Level 1  (1:8735660.37544872)
        1222.99245256282, // AdV-Level 2  (1:4367830.18772436)
        611.49622628141, // AdV-Level 3   (1:2183915.09386218)
        305.748113140705, // AdV-Level 4  (1:1091957.54693109)
        152.874056570353, // AdV-Level 5  (1:545978.773465545)
        76.4370282851763, // AdV-Level 6  (1:272989,386732772)
        38.2185141425881, // AdV-Level 7  (1:136494,693366386)
        19.1092570712941, // AdV-Level 8  (1:68247,3466831931)
        9.55462853564703, // AdV-Level 9  (1:34123,6733415966)
        4.77731426782352, // AdV-Level 10 (1:17061,8366707983)
        2.38865713391176, // AdV-Level 11 (1:8530,91833539914)
        1.19432856695588, // AdV-Level 12 (1:4265,45916769957)
        0.59716428347794 // AdV-Level 13 (1:2132,72958384978)
    ];

    /**
     * The length of matrixIds needs to match the length of the resolutions array
     * @see https://openlayers.org/en/latest/apidoc/module-ol_tilegrid_WMTS-WMTSTileGrid.html
     */
    const matrixIds = new Array(resolutions.length);
    for (let i = 0; i < resolutions.length; i++) {
        matrixIds[i] = i;
    }

    return new WMTS({
        url: `https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/${layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`,
        layer: "web_grau",
        matrixSet: "EU_EPSG_25832_TOPPLUS",
        format: "image/png",
        projection: "EPSG:25832",
        requestEncoding: "REST",
        tileGrid: new WMTSTileGrid({
            origin: topLeftCorner,
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: "default",
        attributions: `Kartendarstellung und Präsentationsgraphiken: © Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html" target="_blank">Datenquellen</a>`
    });
}
```

> Note: The WMTS configuration (for example `topLeftCorner` or `matrixSet`) can be different for each service.
> Please have a look into the WMTS capabilities.

Example: How to create the WMTS source from the services capabilities:

```js
// YOUR-APP/SomeFile.ts

// Imports:
import { MapModel, registerProjections } from "@open-pioneer/map";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { optionsFromCapabilities } from "ol/source/WMTS";

// Global setup: register UTM32 (only needed for this specific layer)
registerProjections({
    "EPSG:31466":
        "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=BETA2007.gsb +units=m +no_defs +type=crs"
});

// Later, for example in a service
const mapModel: MapModel = ... // retrieved via MapRegistry service
await mapModel.whenDisplayed();

const response = await fetch("https://sgx.geodatenzentrum.de/wmts_topplus_open/1.0.0/WMTSCapabilities.xml");
const responseText = await response.text();

const wmtsParser = new WMTSCapabilities();
const wmtsResult = wmtsParser.read(responseText);
const wmtsOptions = optionsFromCapabilities(wmtsResult, {
    layer: "web_light",
    matrixSet: "EU_EPSG_25832_TOPPLUS"
});

if (wmtsOptions) {
    mapModel.layers.addLayer(new SimpleLayer({
        id: "topplus_open_optionsFromCapabilities",
        title: "TopPlus Open - created with optionsFromCapabilities()",
        visible: false,
        layer: new TileLayer({
            source: new WMTS(wmtsOptions)
        })
    }));
}
```

> Note: To avoid adding layers twice (or error messages), check against the layer id with `getLayerById()`.

##### OGC Web Map Service (WMS)

To create a layer configuration for a WMS, use the following configuration approach:

Example: Create WMS layer configuration

```ts
// YOUR-APP/MapConfigProviderImpl.ts
import { MapConfig, MapConfigProvider, WMSLayer } from "@open-pioneer/map";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                new WMSLayer({
                    title: "Schulstandorte",
                    url: "https://www.wms.nrw.de/wms/wms_nw_inspire-schulen",

                    // Configure service (sub-) layers
                    sublayers: [
                        {
                            name: "US.education",
                            title: "Schulen"
                        }
                    ],

                    // Optional, additional options for the underlying ImageWMS source
                    sourceOptions: {
                        // Ratio 1 means image requests are the size of the map viewport
                        ratio: 1
                    }
                })
            ]
        };
    }
}
```

#### Register additional projections

The map supports only the following projections by default: `EPSG:4326`, `EPSG:3857`, `EPSG:25832` and `EPSG:25833`.
To register additional projections to use them for the map, use the `registerProjections` function.

Example: How to register an additional projection to the global [proj4js](https://github.com/proj4js/proj4js) definition set by name (such as `"EPSG:4326"`) and projection definition (string defining the projection or an existing proj4 definition object):

```ts
import { registerProjections } from "@open-pioneer/map";

registerProjections({
    "EPSG:31466":
        "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=BETA2007.gsb +units=m +no_defs +type=crs"
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

This package allows interacting with maps and their layers through multiple interfaces and classes.

The most important API items are as follows:

-   The `MapRegistry` service (inject via `"map.MapRegistry"`).
    This service is used to obtain a reference to the `MapModel` via `registry.getMapModel(mapId)`.

    > NOTE: From inside a React component you can also use the hook `useMapModel(mapId)`.

-   The `MapModel` represents a map in an application.
    Through the `MapModel` one can obtain the map's base layers, operational layers and so on.
    The `MapModel` also provides access to the raw OpenLayers `olMap` for advanced use cases.

    > NOTE: The `olMap` is manipulated by the `MapModel` to implement its functionality (for example, to add or remove layer instances). When using the `olMap` directly, treat it carefully and as a shared resource.

-   The `Layer` interface and its various implementations.
    This interface is used to make common properties and methods available (such as `.title`, or `.setVisible`).
    Layers may also have `.sublayers`, which support the same basic properties as other layer types.

    As is the case in `MapModel`, one can retrieve the raw OpenLayers `olLayer` from a layer instance (the same restrictions apply, see above).

As a general rule of thumb, one should always prefer to use properties or methods provided by this package (if available) instead of manipulating the raw OpenLayers instances.
Manipulating raw instances directly may lead to unexpected results.
For example, other application components may not react to raw property changes correctly because they expect an "official" property to be changed instead.

This point is especially important for the map model's central features:

-   Map composition (access and configuration of layers, base layers, removing layers)
-   Layer visibility
-   Custom layer metadata (`attributes`)

In those cases, the properties or methods provided by this package should always be used:

-   `map.layers.addLayer(layer)` and `map.layers.removeLayerById(layerId)` to add or remove layers
-   `map.layers.getAllLayers()`, `map.layers.getBaseLayers()`, `map.layers.getOperationalLayers()` etc. to access (top-level) layers
-   `layer.setVisible(visible)` and `map.layers.activateBaseLayer(layerId)` to control visibility
-   `layer.updateAttributes()` and `layer.deleteAttributes()` to change a layer's custom attributes

#### Layer classes

This package currently only provides two layer implementations:

-   `SimpleLayer`.
    Instances of this class can be used to integrate arbitrary OpenLayers `Layer` instances into the map by configuring the `olLayer` constructor option.
    Note that one can only achieve basic integration through this method: more advanced features such as automatic legends or sublayers will not be available.

-   `WMSLayer`.
    Represents a WMS service embedded into the map.
    Must be configured with the service's `url` and a set of sublayers.

We expect to implement more classes in the future.

#### Using the map model and layers in services

Example: Center map to given coordinates using the map model and set layer visibility using the layer instance.

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

Apache-2.0 (see `LICENSE` file)
