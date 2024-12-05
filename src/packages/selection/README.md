# @open-pioneer/selection

This package provides a UI component to perform a selection on given selection sources from the map.

## Usage

To add the component to your app, import `Selection` from `@open-pioneer/selection`. The `@open-pioneer/notifier` package is required too.

The mandatory properties are `mapId` and `sources` (layer source to be selected on).

`selectionMethods` is an optional property that can hold a list of selection methods: `point`, `extent`.
It defaults to `extent` if omitted.
If more than one method is provided, buttons to toggle between them are added to the selection window.
The first method in the list is initially selected.

The limit per selection is 10.000 items.

```tsx
<Selection mapId={MAP_ID} sources={selectionsources} />
```

### Listening to events

To listen to the events `onSelectionComplete` and `onSelectionSourceChanged`, provide optional callback functions to the component.

In case of the `onSelectionComplete` event, you can access the selection result (and its source) from the parameter `SelectionCompleteEvent`.
In case of the `onSelectionSourceChanged` event, you can access the selected selection source from the parameter `SelectionSourceChangedEvent`.

```tsx
import { Search, SearchSelectEvent } from "@open-pioneer/search";
<Selection
    mapId={MAP_ID}
    sources={datasources}
    selectionMethods={["extent", "point"]}
    onSelectionComplete={(event: SelectionCompleteEvent) => {
        // do something
    }}
    onSelectionSourceChanged={(event: SelectionSourceChangedEvent) => {
        // do something
    }}
/>;
```

### Implementing a selection source

To provide the selection sources that are used by the selection-UI component, implement the function `select` for each selection source:

```tsx
import {
    Selection,
    SelectionResult,
    SelectionSource,
    SelectionSourceStatus
} from "@open-pioneer/selection";
import { MAP_ID } from "./MapConfigProviderImpl";

class MySelectionSource implements SelectionSource {
    // The label of this source, used as a title for this source's results.
    label = "My sample REST-Service";

    // The optional status of this source. If there is no status defined, it is assumed that the source is always available.
    status?: SelectionSourceStatus;

    // The reason that the source is not available. If it is not defined, the i18n value for "sourceNotAvailable" will be displayed
    unavailableStatusReason?: string;

    // Performs a selection with a given selectionKind and returns a list of selection results.
    // see the API documentation of `SelectionSource`.
    select(selectionKind: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {}
}

const selectionsources: SelectionSource[] = [new MySelectionSource()];

// In your JSX template:
<Selection mapId={MAP_ID} sources={selectionsources} />;
```

### VectorLayer as selection source

To use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map) as a selection source,
the provided service `VectorSelectionSourceFactory` can be used to create an instance of `VectorLayerSelectionSource`.

Key features of this selection source implementation are:

-   using only the extent as selection kind
-   listening to layer visibility changes and updating the status of the source
-   limiting the number of returned selection results to the corresponding selection option
-   throwing an event `changed:status` when the status updates

Inject the selection source factory by referencing `"selection.VectorSelectionSourceFactory"`:

```js
// build.config.mjs
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        YourService: {
            // ...
            references: {
                vectorSelectionSourceFactory: "selection.VectorSelectionSourceFactory"
            }
        }
    }
});
```

and create a selection source instance:

```ts
const vectorSelectionSourceFactory = this._vectorSelectionSourceFactory; // injected
const layerSelectionSource = vectorSelectionSourceFactory.createSelectionSource({
    vectorLayer: vectorLayer,
    label: "My Vector Layer Title shown in UI"
});

const eventHandler = layerSelectionSource.on("changed:status", () => {
    // do something (e.g. like removing map highlighting if unavailable)
});
```

## License

Apache-2.0 (see `LICENSE` file)
