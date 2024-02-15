# @open-pioneer/result-list

This package provides a UI component to display Data from other packages, such as the selection.

## Integration UI component

To add the package to your app, import `result-list` from `@open-pioneer/result-list`.

```tsx
import { ResultList } from "@open-pioneer/result-list";
<ResultList resultListInput={input} />;
```

To add the UI component take a look at the README.md of the default sample application.
There you can see how the component is installed and how it can be linked to other packages.

## Usage

Note that all data must satisfy the Interface ResultListInput (see api.ts).
This means that metadata must also be available for each data column.
The metadata has to be configured in the "attributes" of each layer (`resultListMetadata`).

If you want to display the column with a different name, you can configure an optional `displayName`
for each `propertyName`.

If you want a column to have a defined width, you can provide the optional `width` attribute
of the result list column in pixel. (If there are only a few columns with a defined width,
the remaining space is distributed along these columns.)

If you want the values of a column to be other than the `BaseFeature.properties[propertyName]`,
you can provide a `getPropertyValue` function to return the value of the `BaseFeature` for the
column. This can be especially useful, if you want to display the id of the feature.

```ts
new SimpleLayer({
    id: "ogc_kitas",
    title: "Kindertagesstätten",
    visible: true,
    olLayer: createKitasLayer(),
    attributes: {
        "legend": pointLayerLegendProps,
        "resultListMetadata": [
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

### Select / Deselect Data

To select or deselect individual lines, you can click on the checkbox at the beginning of a line.
If you want to select or deselect all rows you have to click on the checkbox in the first column header.

Alternatively, you can use the keyboard navigation and select or deselect the checkboxes by pressing
spacebar.

### Sorting Data

If you want to sort the data by a single column, you have to click on the column header.
The arrows show in which direction the sorting took place.

Alternatively, you can use the keyboard navigation and toggle sorting by pressing the enter key.

## License

Apache-2.0 (see `LICENSE` file)
