# @open-pioneer/result-list

This package provides a UI component to display features and their attributes.

## Usage

To add the package to your app, import `ResultList` from `@open-pioneer/result-list`. Furthermore, the Id of the currently used map is required.

```tsx
import { ResultList } from "@open-pioneer/result-list";
<ResultList mapId={mapId} input={input} />;
```

The following section describes how to define the `input` parameter.

### Configuring result list data, columns and formatOptions

The `input` property determines which features are displayed (`input.data`) and in what format (`input.columns`
and `input.formatOptions`).
`input` must conform to the TypeScript interface `ResultListInput`.

`input.data` must be an array of features (TypeScript interface `BaseFeature`).
Features can be defined manually or obtained from the UI components of other packages,
for example from `@open-pioneer/search` and `@open-pioneer/selection`.

`input.columns` is an array of column definitions (TypeScript interface `ResultColumn`).
The columns define which fields of the configured features are displayed and how the cells in the column are displayed.
The result list renders the specified columns in the order in which they are given.

`input.formatOptions` determines how numbers and dates are formatted.
You can specify the `numberOptions` and `dateOptions` properties to format numbers and dates.
The properties are applied to all table cells of the corresponding type and for which no `render` function is configured.

The following sample shows a configuration for objects that all have the properties `name` and `age`:

```jsx
<ResultList
    input={{
        data: features, // Obtained from somewhere
        columns: [
            {
                propertyName: "name"
            },
            {
                propertyName: "age"
            }
        ]
    }}
/>
```

The `propertyName` of a column serves as the header for that column.
To display the column with a different title, configure the optional `displayName` property.

To define the width for a column, provide the optional `width` property
(in pixels).

```js
// Column with explicit width.
const columns = [
    {
        propertyName: "name",
        width: 100
    }
];
```

The remaining space is distributed to the columns that do not have a defined width.

To display values that are not present directly on the feature (for example `feature.properties[propertyName]`), provide a `getPropertyValue` function:

```js
// Simple computed column.
// The `getPropertyValue` function is called for every feature.
// It should be efficient because it can be invoked many times.
const columns = [
    {
        displayName: "ID",
        getPropertyValue(feature: BaseFeature) {
            return feature.id;
        }
    }
]
```

To display a cell value as a customizable react component, provide a `renderCell` function to each column:

```tsx
// Simple usage of a render function
// The `renderCell` function is called for every feature.
// It should be efficient because it can be invoked many times.
const columns = [
    {
        displayName: "ID",
        renderCell: ({ feature }) => (
            <chakra.div>{`This item has the following ID: ${feature.id}`}</chakra.div>
        )
    }
];
```

### Configuring highlighting of data

The optional property `enableHighlight` determines whether data in the results list should be highlighted in the map. The defaulvalue is `true`.
The default style can be overridden using the optional `highlightOptions` property. `highlightOptions` must conform to the TypeScript interface `HighlightOptions`. Please note that the highlighting of the result-list can be obscured by highlights from other packages (e.g. selection).

```ts
import { ResultList } from "@open-pioneer/result-list";
const ownHighlightStyle = {
    "Polygon": [
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(51, 171, 71,0.35)"
            })
        })
    ],
};
<ResultList mapId={mapId} input={input} highlightOptions= {ownHighlightStyle}/>
```

### Selection

Users can select (and deselect) individual features by clicking on the checkbox at the beginning of a row.
A checkbox in the header of the table allows to select (or deselect) _all_ features in the table.

### Listening for selection changes

​The `ResultList` supports listening to selection changes via the optional property `onSelectionChange`.
An event handler function can be passed that will be invoked whenever the user changes the selection.

```ts
import { ResultList } from "@open-pioneer/result-list";

const selectionChangeListener = useCallback((event: ResultListSelectionChangeEvent) => {
    // Logs the currently selected features
    console.log("selection changed", event.features);
}, []);

<ResultList mapId={mapId} input={input} onSelectionChange={selectionChangeListener}/>
```

### Track selected features

To keep track of the currently selected features (or their ids), store them in a `useState` slot (or anywhere else):

```tsx
const [selectedFeatures, setSelectedFeatures] = useState<BaseFeature[]>([]);

const selectionChangeListener = useCallback((event: ResultListSelectionChangeEvent) => {
    setSelectedFeatures(event.features);
    // Helper function if you're only interested in the feature ids:
    // event.getFeatureIds()
}, []);

<ResultList mapId={mapId} input={input} onSelectionChange={selectionChangeListener} />;
```

### Sorting data

Users can click on a column header to sort the table by property values associated with that column.
An icon within the header indicates the current sort order.

Sorting only works for columns with associated sortable property values.

### State management

The result list preserves its internal state by default if properties change.
For example, when `data` or `columns` is modified, the scroll position, the selection and the sort order remains the same (assuming the sorted column still exists).

This is done to enable use cases such as:

-   dynamically showing or hiding certain columns depending on application state
-   dynamically adding new items to or removing items from the component

To discard the existing state, see "Resetting component state".

## Examples

### Defining result list metadata on a layer

Result list metadata (columns etc.) can be defined anywhere.
To always display features from a layer in the same way, define the metadata directly on the layer (via `attributes`).
For example:

```js
new SimpleLayer({
    id: "ogc_kitas",
    title: "Kindertagesstätten",
    olLayer: createKitasLayer(),
    attributes: {
        "resultListColumns": [
            {
                propertyName: "id",
                displayName: "ID",
                width: 100,
                getPropertyValue(feature: BaseFeature) {
                    return feature.id;
                }
            },
            {
                propertyName: "pointOfContact.address.postCode",
                displayName: "PLZ",
                width: 120
            }
        ]
    }
});
```

The `resultListColumns` attribute can be retrieved by accessing `layer.attributes["resultListColumns"]`.

> Neither the map model nor the result list interprets `resultListColumns` by itself.
> You have to forward this attribute into the `columns` property.

### Integrating the result list above the map

The following snippet embeds the result list into a fixed-height box at the bottom of the container.
The example assumes that the surrounding element (or one of its parents) uses `position: relative`.

Configure the `viewPadding` on the associated `MapContainer` when the result list component is displayed to inform the map about the "overlay".

```jsx
<Box
    position="absolute"
    visibility={showResultList ? "visible" : "hidden"}
    bottom="0"
    backgroundColor="white"
    width="100%"
    height={`${RESULT_LIST_HEIGHT_PIXELS}px`}
    borderTop="2px solid"
    borderColor="trails.500"
    zIndex={1}
>
    <ResultList key={resultListKey} mapId={mapId} input={resultListInput} />
</Box>
```

### Resetting component state

As described in "Usage", the result list preserves its existing state (selection, sort order, etc.) if its properties (data, columns, etc.) change.

To force the result list to throw away its existing state, use React's `key` property and assign it a new value, for example:

```jsx
<ResultList
    /* Simply use a different value (e.g. auto incrementing id, or data source id, ...)
       to throw away existing state. React will create a new component behind the scenes
       with entirely new state. */
    key={resultListKey}
    mapId={mapId}
    input={resultListInput}
/>
```

## License

Apache-2.0 (see `LICENSE` file)
