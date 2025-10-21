# @open-pioneer/map

## 1.0.0

### Major Changes

- b3709f1: **Breaking:** Remove layer constructor types from public API (e.g. `SimpleLayerConstructor`).
- 9e9bc6e: **Breaking**: Internal layers are no longer returned from getters such as `getItems()` or `getRecursiveLayers()` by default.

    A new option `includeInternalLayers` has been implemented to opt-in into internal layers.
    By default, internal layers are not returned by functions like `getItems()` or `getRecursiveLayers()`.
    If internal layer should be returned this must be specified explicitly with the `includeInternalLayers` option.

    ```js
    import { MapModel } from "@open-pioneer/map";

    //internal layers are not included
    const layers = myMapModel.layers.getItems();
    //include internal layers
    const allLayers = myMapModel.layers.getItems({ includeInternalLayers: true });
    ```

    Note that if internal layers are returned this includes system layers (e.g. for highlights or geolocation) that were not explicitly added to the map.
    The described behavior is aligned for the functions `getItems()`, `getLayers()`, `getAllLayers()` and `getRecursiveLayers()` in `LayerCollection`, `WMSLayer` and `GroupLayer`.
    The function `getRecursiveLayers()` does not return non-internal child layers of an internal layer.

- b3709f1: **Breaking:** Remove old event API from layer types and the map model.

    These were only used for the `"destroy"` event.

    ```ts
    // OLD, removed API:
    const layer = ...;
    layer.on("destroyed", () => {
        console.debug("layer was destroyed");
    });
    ```

    The destroy event still exists, but is now based on the event system of the [reactivity API](https://github.com/conterra/reactivity/tree/main/packages/reactivity-events):

    ```ts
    // NEW
    import { on } from "@conterra/reactivity-events";

    const layer = ...;
    on(layer.destroyed, () => {
        console.debug("layer was destroyed");
    });

    const mapModel = ...;
    on(mapModel.destroyed, () => {
        console.debug("layer was destroyed");
    });
    ```

- a1614de: **Breaking**: Remove support for `mapId` in all React components.

    To configure the map for a component (for example: `Legend`), either pass the `map`
    as an explicit parameter or use the `DefaultMapProvider`:

    ```ts
    // Explicit API
    <Legend map={map} />

    // All children of the DefaultMapProvider can use the configured map
    <DefaultMapProvider map={map}>
        <MapContainer />
        <Legend />
        <SomeOtherComponent />
    </DefaultMapProvider>;
    ```

    Support for `mapId` was removed in [PR #486](https://github.com/open-pioneer/trails-openlayers-base-packages/pull/486).

### Minor Changes

- 29a10df: Support buffer for zoom geometries.
  Use the `buffer` option to specify the size increase. E.g. `0.1` for 10% size increase.

    We use the already existing `calculateBufferedExtent` function to compute the buffer.

    For example:

    ```ts
    const map: MapModel = ...;
    const highlight = map.highlightAndZoom(someGeometries, {
        // Grows extent by 10%
        buffer: 0.1
    });
    ```

- 2702df4: Introduce `internal` property for all layer types (including sublayers).
  If `internal` is `true` (default: `false`) the layer is not considered by any UI widget (e.g. Legend and Toc).
  The `internal` state of a layer is not to be confused with the layer's visibility on the map which is determined by the `visible` property.

    ```typescript
    //internal layer is visible on the map but hidden in UI elements like legend and Toc
    const internalLayer = new SimpleLayer({
        id: "layer1",
        title: "layer 1",
        olLayer: myOlLayer,
        visible: true,
        internal: true
    });
    ```

- 5df900f: Add a new hook `useMapModelValue(props?)`.
  The hook returns either the directly configured `map` (via props) or the default map from a parent `DefaultMapProvider`.
  If neither is present, an error will be thrown.

    This hook is used in all components that work with the map.
    The typical usage works like this:

    ```ts
    import { MapModelProps, useMapModelValue } from "@open-pioneer/map";

    // optional `map` property inherited from `MapModelProps`
    export interface MyComponentProps extends MapModelProps {
        // ... other properties
    }

    export function MyComponent(props) {
        const map = useMapModelValue(props); // looks up the map
    }
    ```

    You can also call this hook without any arguments:

    ```ts
    // Map model from DefaultMapProvider or an error.
    const mapModel = useMapModelValue();
    ```

    This hook should replace _most_ usages `useMapModel`, which can't return the map model directly since it may not have finished construction yet.

- 14c484e: Introduce the `LayerFactory` service (interface `"map.LayerFactory"`).

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

- aeb9000: Add new `"topmost"` option to add layers that are always displayed on top (above all other layers).

    A new layers can be added at `topmost` to ensure that this layer will always be displayed on top of the other layers.
    This can be used, for example, to implement highlights or to draw graphics.
    Layers added at `"topmost"` will always be shown above layers at `"top"`.

    When using the `"above"` or `"below"` options with a `"topmost"` reference layer, that layer becomes `"topmost"` as well.

    ```typescript
    import { MapModel, SimpleLayer } from "@open-pioneer/map";

    const highlightLayer = new SimpleLayer({
        title: "highlights",
        olLayer: myOlLayer
    });
    //always displayed at the top
    myMapModel.layers.addLayer(highlightLayer, { at: "topmost" });
    ```

- 5df900f: Deprecate the parameter-less signature of `useMapModel()`:

    ```ts
    // Returns the DefaultMapProvider's map, but wrapped in a result value (loading/resolved/rejected)
    const result = useMapModel();
    ```

    Use `useMapModelValue()` instead:

    ```ts
    // Returns the map model directly.
    const mapModel = useMapModelValue();
    ```

    All other signatures of `useMapModel()` are still fully supported.

- 773fa2d: The map now has an appropriate focus outline style by default, which respects the map view's padding.
  For information on disabling this behavior, see the map package documentation.
- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- c6180c6: Update eslint to version 9.
- 10d2fe7: Update dependencies
- 4f1e7bd: The highlight layer(s) created by this package now uses the map model's `topmost` option to register an (internal) layer.
  The previous implementation was based on adding a "raw" OpenLayers layer to the `olMap`.
- 12561fe: The default value of the `role` prop on the `MapContainer` was changed to `application` to allow map keyboard navigation while using NVDA screen reader.
- 8986b3b: Remove obsolete dependency @types/proj4
- 138d85b: Update core packages to 4.2.0
- 4f1e7bd: The internal constant `TOPMOST_LAYER_Z` has been removed.
  To configure a layer that is always on top:
    - Create a layer using the `LayerFactory`
    - Add it to the map model and specify the `at: "topmost"` option

- 2c8b617: Introduce `MapRegistry.createMapModel` method to create a `MapModel` without a `MapConfigProvider`.
  For more details, see [PR](https://github.com/open-pioneer/trails-openlayers-base-packages/pull/499) and [issue](https://github.com/open-pioneer/trails-openlayers-base-packages/issues/483).
- b3709f1: Refactor map package internals.
- f1f69f2: Update to OpenLayers 10.6.1
- da6a410: Update dependencies

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0
- acd5115: **Breaking:** Remove the following hooks, which were deprecated since version 0.8.0:
    - useView
    - useProjection
    - useResolution
    - useCenter
    - useScale

    Use reactive properties on the map model instead, e.g. `mapModel.scale`.

- 738390e: Update to Chakra v3

### Patch Changes

- 738390e: Fix an issue with "raw" map container children that are not wrapped in a map anchor.

    Consider, for example, the following snippet:

    ```tsx
    <MapContainer>
        {/* .custom-content does absolute positioning relative to map container */}
        <div className="custom-content">Hi</div>
    </MapContainer>
    ```

    Previously, the `div` was rendered relative to the map container div but did _not_ respect the map's view padding.
    Now the `div` will move according to the map padding as well.

- 0a8ff71: The default attribution widget created for the map now has `role="region"` and an `aria-label` for improved screen reader support.

    ```html
    <div
        style="pointer-events: auto;"
        class="ol-attribution ol-unselectable ol-control ol-uncollapsible"
        role="region"
        aria-label="Quellenangaben"
    >
        <!-- Attributions -->
    </div>
    ```

## 0.10.0

### Minor Changes

- 193068a: Deprecate the `mapId` property on React components.
  Use the `MapModel` directly instead to pass a reference to the map.

    Example:

    ```tsx
    // Default map for entire component tree
    <DefaultMapProvider map={mapModel}>
        <Toc />
    </DefaultMapProvider>

    // Map for specific component
    <Toc map={mapModel} />
    ```

### Patch Changes

- 2bafdad: Top level operational layers can now be inserted at an arbitrary position.

    ```ts
    const mapModel = ...;
    const newLayer = new SimpleLayer({
        title: "New layer",
        // ...
    });

    mapModel.layers.addLayer(newLayer, { at: "top" }); // Same as default: on top of all existing operational layers
    mapModel.layers.addLayer(newLayer, { at: "bottom" }); // Below all other operational layers

    const otherLayer = ...; // Eiter a valid layer id or a layer instance. Must be from the same collection.
    mapModel.layers.addLayer(newLayer, { at: "above", reference: otherLayer }); // Above the reference layer
    mapModel.layers.addLayer(newLayer, { at: "below", reference: otherLayer }); // Below the reference layer
    ```

- cd1435b: Update ol to 10.5.0
- 032eed7: Bump dependencies.
- cd1435b: Update to react 19.1.0
- 7558df4: Add new map anchor positioning options.

    The following positions are now supported:

    ```ts
    export type MapAnchorPosition =
        | "manual"
        | "top-left"
        | "top-right"
        | "top-center"
        | "bottom-left"
        | "bottom-right"
        | "bottom-center"
        | "left-center"
        | "right-center"
        | "center";
    ```

    You can use `manual` positioning to position an anchor using CSS.
    For example:

    ```tsx
    <MapAnchor className="manual-position" position="manual">
        <Box
            backgroundColor="whiteAlpha.800"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
        >
            Manually positioned anchor
        </Box>
    ```

    Combined with css:

    ```css
    .manual-position {
        left: 200px;
        top: 200px;
    }
    ```

## 0.9.0

### Minor Changes

- e7fdc5d: improve scale calculation for none-metric projections

    Fix scale calculation for projections with none-metric units (e.g. EPSG:4326).
    Note: The calculated scale (`useScale`) still may deviate from the desired scale (`setScale`) for non-metric projections. This is due to limitiations in the [getPointResolution](https://openlayers.org/en/latest/apidoc/module-ol_proj.html#.getPointResolution) function from OL.

- cb94c75: update dependencies
- f327eec: Deprecate `mapModel.layers.getAllLayers()`.
  Use `mapModel.layers.getLayers()` instead.
  The name of `getAllLayers()` is misleading because it does not recurse into nested layers.
- f327eec: Add function `getRecursiveLayers()` to `LayerCollection`, `SublayerCollection` and `GroupLayerCollection` in `@open-pioneer/map`

    Compared to `getLayers` and `getOperationalLayers`, `getRecursiveLayer` returns all (nested) child and sub layers of a collection.
    The property `options.filter` can be used to exclude layers (and their child layers) from the result. For `LayerCollection`, `getRecursiveLayers()` provides the predefined filters `base` and `operational` to return either base layers or operation layers only.

    The function might be costly if the hierarchy of layers is deeply nested because the layer tree has to be traversed recursively.
    In some scenarios using `options.filter` could be used to improve the performance because it is not necessary to traverse the layer tree completely if some layers are excluded.

    Example (using GroupLayerCollection):

    ```typescript
    const grouplayer = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [
            new SimpleLayer({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            new GroupLayer({
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    new SimpleLayer({
                        id: "subgroupmember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            })
        ]
    });

    // Returns only the layer "member" because the provided filter function excludes "subgroup" and (implicitly) its child "subgroupmember".
    const layers = grouplayer.layers.getRecursiveLayers({
        filter: (layer) => layer.id !== "subgroup"
    });
    ```

### Patch Changes

- 37cd707: Add a generic type parameter `PropertiesType` to the `BaseFeature` interface.
  This allows specifying the type of the `properties` attribute.
  The default type is `Readonly<Record<string, unknown>>` for backwards compatibility.

    Example:

    ```ts
    interface MyFeatureProperties {
        name: string;
    }

    const feature: BaseFeature<MyFeatureProperties> = {
        id: 123,
        properties: {
            name: "Example Feature"
        }
    };

    // string | undefined instead of `unknown`
    const name = feature.properties?.name;
    ```

- 32ed2cd: Fix `mapModel.layers.getLayerById()` not being reactive (#400).
- 209eb8e: Added a configuration option to disable fetching of WMS service capabilities.
- d72e42c: Removed BKGTopPlusOpen layer source. The BKGTopPlusOpen was an internal layer source only needed for tests. Please use own test sources instead.

## 0.8.0

### Minor Changes

- b717121: Update from OL 9 to OL 10.
- e7978a8: **Breaking:** Remove most events from the map model and the layer interfaces.
  All events that were merely used to synchronized state (e.g. `changed:title` etc.) have been removed.

    The map model and related objects (layers, layer collections, etc.) are now based on the [Reactivity API](https://github.com/conterra/reactivity/blob/main/packages/reactivity-core/README.md).
    This change greatly simplifies the code that is necessary to access up-to-date values and to react to changes.

    For example, from inside a React component, you can now write:

    ```jsx
    import { useReactiveSnapshot } from "@open-pioneer/reactivity";

    function YourComponent() {
        // Always up to date, even if the layer's title changes.
        // No more need to listen to events.
        const title = useReactiveSnapshot(() => layer.title, [layer]);
        return <div>{title}</div>;
    }
    ```

    And inside a normal JavaScript function, you can watch for changes like this:

    ```js
    import { watch } from "@conterra/reactivity-core";

    const watchHandle = watch(
        () => [layer.title],
        ([newTitle]) => {
            console.log("The title changed to", newTitle);
        }
    );

    // Later, cleanup:
    watchHandle.destroy();
    ```

    For more details, check the [Reactivity API documentation](https://github.com/conterra/reactivity/blob/main/packages/reactivity-core/README.md).

- 7ae9f90: Add new `children` property to all layers.
  This property makes it possible to handle any layer children in a generic fashion, regardless of the layer's actual type.

    `layer.children` is either an alias of `layer.sublayers` (if the layer has sublayers), `layer.layers` (if it's a `GroupLayer`) or undefined, if the layer does not have any children.

- d8337a6: The following hooks are deprecated and will be removed in a future release:
    - `useView`
    - `useProjection`
    - `useResolution`
    - `useCenter`
    - `useScale`

    They can all be replaced by using the new reactive properties on the `MapModel`, for example:

    ```javascript
    // old:
    const center = useCenter(olMap);

    // new:
    const center = useReactiveSnapshot(() => mapModel.center, [mapModel]);
    ```

- 2fa8020: Update trails core package dependencies.
    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

- 7ae9f90: Add new layer type `GroupLayer` to to the Map API.

    A `GroupLayer` contains a list of `Layer` (e.g. `SimpleLayer` or `WMSLayer`). Because `GroupLayer` is a `Layer` as well nested groups are supported.
    The child layers of a `GroupLayer` can be accessed with the `layers` property - `layers` is `undefined` if it is not a group.
    The parent `GroupLayer` of a child layer can be accessed with the `parent` property - `parent` is `undefined` if this layer is not part of a group (or not a sublayer).

    ```js
    const olLayer1 = new TileLayer({
        source: new OSM()
    });
    const olLayer2 = new TileLayer({
        source: new BkgTopPlusOpen()
    });

    // Create group layer with nested sub group
    const group = new GroupLayer({
        id: "group",
        title: "a group layer",
        layers: [
            new SimpleLayer({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            new GroupLayer({
                id: "subgroup",
                title: "a nested group layer",
                layers: [
                    new SimpleLayer({
                        id: "submember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            })
        ]
    });

    const childLayers: GroupLayerCollection = group.layers; // Access child layers
    ```

    Layers can only be added to a single group or map.
    Sublayers (e.g. `WMSSublayer`) cannot be added to a group directly.

- d8337a6: Provide new reactive properties on the `MapModel` type.
    - `olView` (-> `olMap.getView()`)
    - `projection` (-> `olMap.getView().getProjection()`)
    - `resolution` (-> `olMap.getView().getResolution()`)
    - `zoomLevel` (-> `olMap.getView().getZoom()`)
    - `center` (-> `olMap.getView().getCenter()`)
    - `scale` (derived from center and resolution)

    Most of the listed properties are already available on raw OpenLayers objects (see code in parentheses above).
    However, those OpenLayers properties require manual work for synchronization, whereas the new properties are reactive (and can be watched, for example, using `useReactiveSnapshot()`).

    A new method `setScale()` has also been added to the model.

### Patch Changes

- 7a5f1e1: Fix keyboard events from map anchors after update to OpenLayers 10.
- 49f0207: Update trails core packages to version 2.4.0
- b2127df: Improve documentation of layers in README

## 0.7.0

### Minor Changes

- 2502050: Introduce union types and `type` attributes for layers. This allows TypeScript narrowing for layers and determining a layer's type.

    The `Layer` and `Sublayer` types for layers remain, but are unions of the corresponding concrete layer types now.
    The layer type `LayerBase` has been removed and is replaced by `AnyLayerType`
    to clarify that this type represents a union of all types of layer (currently `Layer` and `Sublayer`).

    Two type guards have been implemented that allow to check if a layer instance is a `Layer` or `Sublayer`: `isLayer()`and `isSublayer()` (see example below).

    The following `type` attribute values have been implemented at the layers:
    - SimpleLayer: `simple`
    - WMSLayer: `wms`
    - WMSSubLayer: `wms-sublayer`
    - WMTSLayer: `wmts`

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

- 310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

- 310800c: Update core packages version.
- 583f1d6: The `mapId` or `map` properties are now optional on individual components.
  You can use the `DefaultMapProvider` to configure an implicit default value.

    Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

- 583f1d6: All UI components in this project now accept the `mapId` (a `string`) _or_ the `map` (a `MapModel`) directly.
- 397d617: Reimplement computation of map anchor positioning using new css props.
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.
- 583f1d6: The new component `DefaultMapProvider` allows you to configure the _default map_ for its children.
  If `DefaultMapProvider` is used, you can omit the explicit `mapId` (or `map`) property on the individual UI components.

    For many applications, `DefaultMapProvider` can be used to surround all (or most of) the application's UI.

    Example:

    ```tsx
    import { DefaultMapProvider } from "@open-pioneer/map";

    <DefaultMapProvider mapId={MAP_ID}>
        {/* no need to repeat the map id in this subtree, unless you want to use a different one */}
        <MapContainer />
        <Toc />
        <ComplexChild />
    </DefaultMapProvider>;
    ```

- 397d617: Move attribution of OL map according to the map view's padding.

## 0.6.1

### Patch Changes

- b152428: Update trails dependencies
- 291ccb6: Apply layer visibility initially to be consistent with the layer configuration.

## 0.6.0

### Minor Changes

- 0d51d2f: Change how map anchors are positioned in the DOM.

    Previously, map anchor divs were children of the OpenLayers map viewport:

    ```
    .map-container
    └── .ol-viewport
        └── .ol-overlaycontainer-stopevent
            └── .map-anchors
                └── .map-anchor
                    └── ... children ...
    ```

    This interfered with browser event handling, especially if the map anchor's content was interactive.
    The workarounds to stop events from map-anchors to bubble into the map caused surprising behavior (e.g. https://github.com/open-pioneer/trails-openlayers-base-packages/issues/312).

    Now, the DOM looks like this:

    ```
    .map-container
    ├── .map-anchors
    │   └── .map-anchor
    │       └── ... children ...
    └── .ol-viewport
    ```

    Which means that the map-anchors are no longer children of the map.

    You may have to update your custom styles if you relied on the previous DOM hierarchy.

    The `MapAnchor`'s prop `stopEvents` has been deleted as it is no longer needed.
    Browser events happening inside a map anchor or its children will no longer affect the map.

### Patch Changes

- 28e092a: Update dependencies
- 76f8863: Add a new (internal) entry point to support the map-test-utils package.

## 0.5.1

### Patch Changes

- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- b5bb7a1: Adjusted name of Open Pioneer project to Open Pioneer Trails
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies
- Updated dependencies [4140646]
- Updated dependencies [4140646]
- Updated dependencies [81bc7da]
- Updated dependencies [2c092dc]
- Updated dependencies [4140646]
    - @open-pioneer/react-utils@0.2.3

## 0.5.0

### Minor Changes

- 520a97b: Add `ZoomOptions` prop in map package

## 0.4.0

### Minor Changes

- a11bf72: Additional helpers for highlight and zoom
- 9334e81: Update to OpenLayers 9

### Patch Changes

- 1a8ad89: Update package.json metadata
- fc6bf82: introduce sourceOptions parameter to WMTS layer
- a0d8882: hide help texts during map export
- 6162979: Update versions of core packages
- ac7fdd1: Update documentation
- 13ea342: Remove duplicate viewPadding application.
- Updated dependencies [1a8ad89]
    - @open-pioneer/react-utils@0.2.2

## 0.3.1

### Patch Changes

- 611ddb9: Export interface `BaseFeature` from Map API and use it correctly in base packages `selection` and `search`.

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.
- 0456500: Add interface `BaseFeature` to Map API.

### Patch Changes

- a582e5e: Add property `viewPadding` to `HighlightOptions`.
- Updated dependencies [762e7b9]
    - @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

### Patch Changes

- Updated dependencies [70349a8]
    - @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

- 08bffbc: MapModel API has got new methods for zooming/highlighting
- a58546b: Use `HttpService` for default health checks made by the map model.
- a58546b: Use `HttpService` when loading images in WMSLayer.
- 0c4ce04: Add OGC API Tiles (vector tiles) support

## 0.1.0

### Minor Changes

- bb2f27a: Initial release.

### Patch Changes

- Updated dependencies [182da1c]
    - @open-pioneer/react-utils@0.1.0
