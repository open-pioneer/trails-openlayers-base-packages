# @open-pioneer/selection

This package provides a UI component to perform a selection on given selection sources from the map.

TODO:

-   Document that notifier is required in app

## Usage

To use the selection component you have to import `Selection` from `@open-pioneer/selection`.
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
the function `select` for each datasource:

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

The configured maximum number of `maxResultsPerGroup` is passed as `maxResults` inside the option parameter
of the search function, so you are able to fetch no more results than necessary.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
