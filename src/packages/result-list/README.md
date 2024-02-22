# @open-pioneer/result-list

This package provides a UI component to display features and their attributes.

## Usage

To add the package to your app, import `ResultList` from `@open-pioneer/result-list`.

```tsx
import { ResultList } from "@open-pioneer/result-list";
<ResultList input={input} />;
```

See below for how to assemble the `input` parameter.

### Configuring result list data, columns and formatOptions

The `input` prop determines which features are displayed (`input.data`) and in what format (`input.columns`
and `input.formatOptions`).
`input` must conform to the TypeScript interface `ResultListInput`.

`input.data` must be an array of features (TypeScript interface `BaseFeature`).
Features can be defined manually (they are rather simple objects), but they can also be obtained from other package's UI Components,
for example from `@open-pioneer/search` and `@open-pioneer/selection`.

`input.columns` is an array of column definitions (TypeScript interface `ResultColumn`).
These columns define which properties of the configured features are shown, or how cells of the column
should be rendered.
The `ResultList` will render the specified columns in the order in which they are given.

`input.formatOptions` is being used to specify how numbers and dates are formatted. You can provide
`numberOptions` and `dateOptions` and these settings are applied for all table cells that
have no `render` function configured and matches the corresponding type.

Consider a set of features which all have the properties `name` and `age`.
In that case, a simple configuration of the `ResultList` may look as follows:

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

The `propertyName` of a column also serves as the default header content for that column.
If you want to display the column with a different title, you can configure an optional `displayName`.

If you want a column to have a defined width, you can provide the optional `width` attribute
of the result list column in pixels.
If some columns do not have an explicit width, the remaining space is distributed along these columns:

```js
// Column with explicit width.
const columns = [
    {
        propertyName: "name",
        width: 100
    }
];
```

If you want to display values that are not present directly on the feature (i.e. `feature.properties[propertyName]`),
you can provide a `getPropertyValue` function to provide a custom value:

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

If you want to display a cell value as a very customizable react component, you can provide a `renderCell` function to each column:

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

### Selection

The user can select (and deselect) individual features by clicking on the checkbox at the beginning of a row.
Another checkbox is present in the header of the table to select (or deselect) _all_ features in the table.

### Sorting Data

The user can click on a column header to sort the table by property values associated with that column.
An icon within the header indicates the current sort order.

Note that sorting only works for columns with associated sortable property values.

### State management

The result list will preserve its internal state by default if properties change.
For example, when `data` or `columns` is modified, the scroll position, the selection and the sort order will remain the same (assuming the sorted column still exists).

This is done to enable use cases such as:

-   dynamically showing or hiding certain columns depending on application state
-   dynamically adding new items to or removing items from the component
-   ...

See example "Resetting component state" for how to throw away existing state under some circumstances.

## Examples

### Defining result list metadata on a layer

Result list metadata (columns etc.) can be defined anywhere.
It can be convenient to define them directly on a layer (via `attributes`), if features from that layer are always displayed in a certain way. For example:

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

You can then simply retrieve the `resultListColumns` attribute at a later time by accessing `layer.attributes["resultListColumns"]`.
Note that neither the map model nor the result list will interpret `resultListColumns` by itself in any way - this is a user defined attribute.
You have to forward this attribute into the `columns` prop on your own.

### Integrating the result list above the map

The following snippet embeds the result list into a fixed-height box at the bottom of the container.
The example assumes that the surrounding element (or one of its parents) uses `position: relative`.

Consider configuring the `viewPadding` on the related `MapContainer` whenever the result list component is being displayed
to inform the map about the "overlay".

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
    <ResultList key={resultListKey} input={resultListInput} />
</Box>
```

### Resetting component state

As described under "Usage", the result list will usually attempt to preserve its existing state (selection, sort order, etc.) if its properties (data, columns, etc.) change.

This may not be what you want if you're filling the result list with new, completely unrelated data.
To force the result list to throw away its existing state, simply use React's `key` prop and assign it a new value, for example:

```jsx
<ResultList
    /* Simply use a different value (e.g. auto incrementing id, or data source id, ...)
       to throw away existing state. React will create a new component behind the scenes
       with entirely new state. */
    key={resultListKey}
    input={resultListInput}
/>
```

## License

Apache-2.0 (see `LICENSE` file)
