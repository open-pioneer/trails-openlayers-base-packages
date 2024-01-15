# @open-pioneer/selection

This package provides a UI component to perform a selection on given selection sources from the map.

## Usage

To add the component in your app, import `Selection` from `@open-pioneer/selection`. The `@open-pioneer/notifier` package is required too.

The mandatory properties of the `Selection` component are `mapId` and `sources` (layer source to be selected on). Beware the limitation per selection are 10000 items.

```tsx
<Selection mapId={MAP_ID} sources={selectionsources} />
```

### Listening to events

If you want to listen to the events `onSelectionComplete` and `onSelectionSourceChanged`, you can provide optional callback functions to the component.

In case of the `onSelectionComplete` event, you can access the selection result (and its source)
from the parameter `SelectionCompleteEvent`. In case of the `onSelectionSourceChanged` event, you can access the selected selection source
from the parameter `SelectionSourceChangedEvent`.

```tsx
import { Search, SearchSelectEvent } from "@open-pioneer/search";
<Selection
    mapId={MAP_ID}
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

You have to provide the selection sources that are used by the selection-UI component by implementing
the function `select` for each selection source:

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

    // Performs a selection and returns a list of selection results.
    // see the API documentation of `SelectionSource`.
    select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]>;
}

const selectionsources: SelectionSource[] = [new MySelectionSource()];

// In your JSX template:
<Selection mapId={MAP_ID} sources={selectionsources} />;
```

### VectorLayer as selection source

To use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map) as a selection source, this example implementation
can be used.

Key features are:

-   using only the extent as selection kind
-   listening to layer visibility changes and updating the status of the source
-   limiting the number of returned selection results to the corresponding selection option
-   throwing an event `changed:status` when the status updates

This implementation is also used inside the default map sample app.

```ts
export class VectorLayerSelectionSource
    extends EventEmitter<SelectionSourceEvents>
    implements SelectionSource
{
    readonly label: string;
    #status: Exclude<SelectionSourceStatus, string> = { kind: "available" };
    #vectorLayer: VectorLayer<VectorSource>;
    #eventHandler: EventsKey;
    #layerNotVisibleReason: string;

    constructor(
        vectorLayer: VectorLayer<VectorSource>,
        label: string,
        layerNotVisibleReason: string
    ) {
        super();
        this.label = label;
        this.#vectorLayer = vectorLayer;
        this.#layerNotVisibleReason = layerNotVisibleReason;
        this.#updateStatus();
        this.#eventHandler = this.#vectorLayer.on("change:visible", () => {
            this.#updateStatus();
        });
    }

    destroy() {
        unByKey(this.#eventHandler);
    }

    get status(): SelectionSourceStatus {
        return this.#status;
    }

    async select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        if (selection.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selection.type}`);
        }

        if (this.#status.kind !== "available" || this.#vectorLayer.getSource() === null) return [];

        const allResults: SelectionResult[] = [];
        this.#vectorLayer
            .getSource()!
            .forEachFeatureIntersectingExtent(selection.extent, (feature) => {
                if (!feature.getGeometry()) return;
                const result: SelectionResult = {
                    id: feature.getId()?.toString() || feature.getGeometry.toString(),
                    geometry: feature.getGeometry()!
                };
                allResults.push(result);
            });
        const selectedFeatures = allResults.filter((s): s is SelectionResult => s != null);
        const limitedFeatures =
            selectedFeatures.length > options.maxResults
                ? selectedFeatures.slice(0, options.maxResults)
                : selectedFeatures;
        return limitedFeatures;
    }

    #updateStatus() {
        const layerIsVisible = this.#vectorLayer.getVisible();
        const newStatus: SelectionSourceStatus = layerIsVisible
            ? { kind: "available" }
            : { kind: "unavailable", reason: this.#layerNotVisibleReason };
        if (newStatus.kind !== this.#status.kind) {
            this.#status = newStatus;
            this.emit("changed:status");
        }
    }
}
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
