# @open-pioneer/editing

This package provides an editing component.

## Usage

To add the component to your app, inject and import the editing service. Create an new editing workflow with the map model and an URL.

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
const url = new URL("...");
const workflow = editingService.start(map, url);
```

An editing workflow can be stop and reset using the map id.

Reset an editing workflow, unfinished geometry will be removed without leaving the edit mode.

Example:

```js
editingService.reset("mapId");
editingService.stop("mapId");
```

### Watch editing workflow states

During an editing workflow different state can occur. Retrieve the current state with `workflow.getState()`.

Watch editing states with `on()`.

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

```

```
