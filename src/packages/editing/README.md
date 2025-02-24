# @open-pioneer/editing

This package provides an editing service that allows to start and handle geometry editing workflows.

> **_NOTE:_** The editing only works with OGC API Feature Services. The editing was only tested using
> the implementation of the OGC API Features in the XtraServer by interactive instruments.
> The collection in that the geometry will be saved, needs to support the map's coordinate system.
> The saving process may not be suitable for all kinds of OGC API Feature Service set up using the XtraServer.
> Please note the following additional information to ensure that process is appropriate for your services.
>
> Additional information:
>
> - Create Workflow: The feature is saved in the collection as a new feature with an empty properties
>   object and without an id (using POST).
> - Update Workflow: The updated geometry is saved for the feature in the collection using a PATCH request.
>   In addition to the new geometry, the PATCH request sends an empty properties object within the body.

## Usage

To use the editing in an app, inject the editing service. Use the `createFeature` method to create a new `create` editing workflow or `updateFeature` method to create a new `update` editing workflow.

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
const feature = new Feature({});

const createWorkflow = editingService.createFeature(map, editingCollectionUrl);
const updateWorkflow = editingService.updateFeature(map, editingCollectionUrl, feature);
```

An editing workflow can be stopped completely or the current drawing can be reset to the initial state without leaving the edit mode.

Example:

```js
editingService.reset(map);
editingService.stop(map);
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

- The returned promise rejects if saving the feature failed.
- The promise resolves with `undefined` when the editing was stopped.
- The promise resolves with the feature ID when saving was successful.

Example:

```js
workflow
    .whenComplete()
    .then((featureId: Record<string, string> | undefined) => {
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

Each geometry type has its own styling property (currently `polygonStyle` and `vertexStyle`). See OpenLayers [`FlatStyle`](https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html#~FlatStyle) for valid styling options.

Example:

```js
const element = createCustomElement({
    ...,
    config: {
        properties: {
            "@open-pioneer/editing": {
                "polygonStyle": {
                    "fill-color": "rgba(255,255,255,0.4)",
                    "stroke-color": "red",
                    "stroke-width": 2,
                    "circle-radius": 5,
                    "circle-fill-color": "red",
                    "circle-stroke-width": 1.25,
                    "circle-stroke-color": "red"
                },
                "vertexStyle": {
                    "circle-radius": 5,
                    "circle-fill-color": "red",
                    "circle-stroke-width": 1.25,
                    "circle-stroke-color": "red"
                }
            }
        }
    },
    ...
});

customElements.define("ol-map-app", element);
```

Set `vertexStyle` to `null`, if no style is needed.

Example:

```js
const element = createCustomElement({
    ...,
    config: {
        properties: {
            "@open-pioneer/editing": {
                "polygonStyle": {
                    "fill-color": "rgba(255,255,255,0.4)",
                    "stroke-color": "red",
                    "stroke-width": 2,
                    "circle-radius": 5,
                    "circle-fill-color": "red",
                    "circle-stroke-width": 1.25,
                    "circle-stroke-color": "red"
                },
                "vertexStyle": null
            }
        }
    },
    ...
});

customElements.define("ol-map-app", element);
```

### Keyboard shortcuts and operating instructions

The user can use the following keyboard shortcuts / interactions during create feature workflow:

- `Esc`: Reset the drawing
- `Mouse double-click`: Set last vertex and finish drawing
- `Enter`: Finish drawing (vertex that is currently drawn is discarded)

The user can use the following keyboard shortcuts / interactions during update feature workflow:

- `Esc`: Reset the drawing
- `Alt + MouseClick`: Remove vertices from feature
- `Mouse click (outside feature)` or `Enter`: finish editing

## License

Apache-2.0 (see `LICENSE` file)
