# @open-pioneer/map

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
