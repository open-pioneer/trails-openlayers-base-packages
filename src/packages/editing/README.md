# @open-pioneer/editing

This package provides an editing service that allows to start and handle geometry editing workflows.

Note: The editing only works with OGC API Feature Services. The editing was only tested using the implementation of the OGC API Features in the XtraServer by interactive instruments. The collection in that the geometry will be saved, needs to support the map's coordinate system.

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

During an editing workflow different state can occur. Retrieve the current state by calling `getState` method on the workflow.

Alternatively, the state can be watched using `on()`.

Example:

```js
workflow.on("active:drawing", () => {
    // ....
});
```

### Finish editing workflow

After finished the editing, a `Promise` will be returned.

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

After a successful editing, the map must be refresh manual by refresh the OpenLayers layer instance.

Example:

```js
const layer = map.layers.getLayerById("") as Layer;
const vectorLayer = layer?.olLayer as VectorLayer<VectorSource>;
vectorLayer.getSource()?.refresh();
```

## License

Apache-2.0 (see `LICENSE` file)
