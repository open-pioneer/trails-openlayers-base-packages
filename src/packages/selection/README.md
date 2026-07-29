# @open-pioneer/selection

This package provides a UI component to perform a selection on given selection sources from the map.

## Usage

To add the component to your app, import `Selection` from `@open-pioneer/selection`. The `@open-pioneer/notifier` package is required too.

The mandatory properties are `map` (unless the `DefaultMapProvider`is used) and `sources` (layer source to be selected on).
The limit per selection is 10.000 items.

```tsx
<Selection
    map={map}
    sources={selectionsources}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

### Listening to events

To listen to the events `onSelectionComplete` and `onSelectionSourceChanged`, provide optional callback functions to the component.

In case of the `onSelectionComplete` event, you can access the selection result (and its source) from the parameter `SelectionCompleteEvent`.
In case of the `onSelectionSourceChanged` event, you can access the selected selection source from the parameter `SelectionSourceChangedEvent`.

```tsx
import { Search, SearchSelectEvent } from "@open-pioneer/search";
<Selection
    map={map}
    sources={datasources}
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
    SelectionKind,
    SelectionOptions,
    SelectionResult,
    SelectionSource,
    SelectionSourceStatus
} from "@open-pioneer/selection";

class MySelectionSource implements SelectionSource {
    // The optional id of this source. It must be unique among the sources used by the same
    // selection component and it must not change. If no id is defined, the selection component
    // generates one internally.
    id = "my-sample-rest-service";

    // The label of this source, used as a title for this source's results.
    label = "My sample REST-Service";

    // The optional status of this source. If there is no status defined, it is assumed that the source is always available.
    // Use the object form (`{ kind: "unavailable", reason: "..." }`) to tell the user why the source is
    // not available; if no reason is given, the i18n value for "sourceNotAvailable" is displayed.
    // This value may be reactive: changes are reflected in the UI.
    status?: SelectionSourceStatus;

    // Performs a selection with a given selectionKind and returns a list of selection results.
    // see the API documentation of `SelectionSource`.
    select(selectionKind: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {}
}

const selectionsources: SelectionSource[] = [new MySelectionSource()];

// In your JSX template:
<Selection map={map} sources={selectionsources} />;
```

### VectorLayer as selection source

To use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map) as a selection source,
the provided service `VectorSelectionSourceFactory` can be used to create an instance of `VectorLayerSelectionSource`.

Key features of this selection source implementation are:

- using only the extent as selection kind
- listening to layer visibility changes and updating the reactive `status` of the source accordingly
- limiting the number of returned selection results to the corresponding selection option

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
    id: "my-vector-layer", // optional, see "Implementing a selection source"
    vectorLayer: vectorLayer,
    label: "My Vector Layer Title shown in UI"
});
```

The `status` of the source is reactive: it changes when the visibility of the layer changes.
To react to those changes, watch the value using the reactivity API:

```ts
import { watchValue } from "@conterra/reactivity-core";

const handle = watchValue(
    () => layerSelectionSource.status,
    (status) => {
        // do something (e.g. like removing map highlighting if unavailable)
    }
);

// later, when you are no longer interested in the status:
handle.destroy();
```

## License

Apache-2.0 (see `LICENSE` file)
