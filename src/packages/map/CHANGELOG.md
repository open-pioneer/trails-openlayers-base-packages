# @open-pioneer/map

## 0.7.0

### Minor Changes

-   2502050: Introduce union types and `type` attributes for layers. This allows TypeScript narrowing for layers and determining a layer's type.

    The `Layer` and `Sublayer` types for layers remain, but are unions of the corresponding concrete layer types now.
    The layer type `LayerBase` has been removed and is replaced by `AnyLayerType`
    to clarify that this type represents a union of all types of layer (currently `Layer` and `Sublayer`).

    Two type guards have been implemented that allow to check if a layer instance is a `Layer` or `Sublayer`: `isLayer()`and `isSublayer()` (see example below).

    The following `type` attribute values have been implemented at the layers:

    -   SimpleLayer: `simple`
    -   WMSLayer: `wms`
    -   WMSSubLayer: `wms-sublayer`
    -   WMTSLayer: `wmts`

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

-   310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

-   310800c: Update core packages version.
-   583f1d6: The `mapId` or `map` properties are now optional on individual components.
    You can use the `DefaultMapProvider` to configure an implicit default value.

    Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

-   583f1d6: All UI components in this project now accept the `mapId` (a `string`) _or_ the `map` (a `MapModel`) directly.
-   397d617: Reimplement computation of map anchor positioning using new css props.
-   a8b3449: Switch to a new versioning strategy.
    From now on, packages released by this repository share a common version number.
-   900eb11: Update dependencies.
-   583f1d6: The new component `DefaultMapProvider` allows you to configure the _default map_ for its children.
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

-   397d617: Move attribution of OL map according to the map view's padding.

## 0.6.1

### Patch Changes

-   b152428: Update trails dependencies
-   291ccb6: Apply layer visibility initially to be consistent with the layer configuration.

## 0.6.0

### Minor Changes

-   0d51d2f: Change how map anchors are positioned in the DOM.

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

-   28e092a: Update dependencies
-   76f8863: Add a new (internal) entry point to support the map-test-utils package.

## 0.5.1

### Patch Changes

-   4140646: Update trails dependencies
-   4140646: Update to react 18.3.1
-   b5bb7a1: Adjusted name of Open Pioneer project to Open Pioneer Trails
-   81bc7da: Update trails dependencies
-   2c092dc: Update dependencies
-   Updated dependencies [4140646]
-   Updated dependencies [4140646]
-   Updated dependencies [81bc7da]
-   Updated dependencies [2c092dc]
-   Updated dependencies [4140646]
    -   @open-pioneer/react-utils@0.2.3

## 0.5.0

### Minor Changes

-   520a97b: Add `ZoomOptions` prop in map package

## 0.4.0

### Minor Changes

-   a11bf72: Additional helpers for highlight and zoom
-   9334e81: Update to OpenLayers 9

### Patch Changes

-   1a8ad89: Update package.json metadata
-   fc6bf82: introduce sourceOptions parameter to WMTS layer
-   a0d8882: hide help texts during map export
-   6162979: Update versions of core packages
-   ac7fdd1: Update documentation
-   13ea342: Remove duplicate viewPadding application.
-   Updated dependencies [1a8ad89]
    -   @open-pioneer/react-utils@0.2.2

## 0.3.1

### Patch Changes

-   611ddb9: Export interface `BaseFeature` from Map API and use it correctly in base packages `selection` and `search`.

## 0.3.0

### Minor Changes

-   ee7c2d4: Update runtime version.
-   0456500: Add interface `BaseFeature` to Map API.

### Patch Changes

-   a582e5e: Add property `viewPadding` to `HighlightOptions`.
-   Updated dependencies [762e7b9]
    -   @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

-   70349a8: Update to new core packages major versions

### Patch Changes

-   Updated dependencies [70349a8]
    -   @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

-   08bffbc: MapModel API has got new methods for zooming/highlighting
-   a58546b: Use `HttpService` for default health checks made by the map model.
-   a58546b: Use `HttpService` when loading images in WMSLayer.
-   0c4ce04: Add OGC API Tiles (vector tiles) support

## 0.1.0

### Minor Changes

-   bb2f27a: Initial release.

### Patch Changes

-   Updated dependencies [182da1c]
    -   @open-pioneer/react-utils@0.1.0
