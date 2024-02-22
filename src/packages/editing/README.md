# @open-pioneer/editing

This package provides an editing service that allows to start and handle geometry editing workflows.

Note: The editing only works with OGC API Feature Services. The editing was only tested using the implementation of the OGC API Features in the XtraServer by interactive instruments. The collection where the geometry will be saved, needs to support the map's coordinate system.

## Usage

To use the editing in an app, inject the editing service. Use the `start` method to create a new editing workflow.

Example:

```js
// build.config.mjs
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    ui: {
        references: ["editing.EditingService"]
    }
});
```

```tsx
const editingService = useService<EditingService>("editing.EditingService");
const editingCollectionUrl = new URL("...");
const workflow = editingService.start(map, editingCollectionUrl);
```

An editing workflow can be stopped completely or the current drawing can be deleted without leaving the edit mode.

Example:

```js
editingService.reset("mapId");
editingService.stop("mapId");
```

### Watch editing workflow states

During an editing workflow different states can occur. Retrieve the current state by calling `getState` method on the workflow.

Alternatively, the state can be watched using `on()`.

Example:

```js
workflow.on("active:drawing", () => {
    // ....
});
```

### Finish editing workflow

After the editing is finished, a `Promise` will be returned.

-   The returned promise rejects if saving the feature failed.
-   The promise resolves with `undefined` when the editing was stopped.
-   The promise resolves with the feature ID when saving was successful.

Example:

```js
workflow
    .whenComplete()
    .then((featureId: string | undefined) => {
        // ...
    })
    .catch((error: Error) => {
        console.log(error);
    });
```

After the editing was successful, the map must be refreshed manually by refreshing the OpenLayers layer instance.

Example:

```ts
const layer = map.layers.getLayerById("") as Layer;
const vectorLayer = layer?.olLayer as VectorLayer<VectorSource>;
vectorLayer.getSource()?.refresh();
```

### Custom styling

The default style of the geometries can be overridden with a custom style.

Each geometry type has its own styling property (currently only `polygonDrawStyle`). See OpenLayers [`FlatStyleLike`](https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html) for valid styling options.

```js
const element = createCustomElement({
    ...,
    config: {
        properties: {
            "@open-pioneer/editing": {
                "polygonDrawStyle": {
                    "stroke-color": "red",
                    "stroke-width": 2,
                    "fill-color": "rgba(0, 0, 0, 0.1)",
                    "circle-radius": 5,
                    "circle-fill-color": "rgba(255, 0, 0, 0.2)",
                    "circle-stroke-color": "rgba(255, 0, 0, 0.7)",
                    "circle-stroke-width": 2
                }
            }
        }
    },
    ...
});

customElements.define("ol-map-app", element);
```

## License

Apache-2.0 (see `LICENSE` file)
