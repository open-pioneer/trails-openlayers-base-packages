# @open-pioneer/result-list

This package provides a UI component to display Data from other packages, such as the selection.

## Integration UI component

To add the package to your app, import `result-list` from `@open-pioneer/result-list`.

```ts
import { ResultList } from "@open-pioneer/result-list";
<ResultList resultListInput={input} />
```

To add the UI component take a look at the README.md from sample application. There you can see how the component is installed and how it can be linked to other packages.

## Usage

Note that all data must satisfy the Interface ResultListInput (see api.ts). This means that metadata must also be available for each data column. The metadata has to be configured in the "attributes" for each layer.
You can configure for each propertyName a displayName as well as the width of the result list column in pixel. Furthermore, the propertyValue has to be defined.

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

To select or deselect individual lines, you can click on the checkbox at the beginning of a line. If you want to select or deselect all rows you have to click on the checkbox in the first column header.

### Listening for Select-change-Events

​The Result-List has an optional property `onSelectionChanged`. A function can be passed here that receives a ResultListSelectionChangedEvent (see api.ts).

```ts
import { ResultList } from "@open-pioneer/result-list";

const selectionChangeListener = useCallback((_event: ResultListSelectionChangedEvent) => {
        console.log("changed");
    }, []);

<ResultList resultListInput={input} onSelectionChanged={selectionChangeListener}/>
```

#### Get selected Feature and Feature-Ids from Result-List

The ResultListSelectionChangedEvent has a property `features` for all selected Features and a method `getFeatureIds` to get the Ids of all selected Features. You can take this property or method and store the results in states.

```ts
//state for selected Features
const [selectedFeatures, setSelectedFeatures] = useState<BaseFeature[]>([]);

//state for selected Ids
const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

const selectionChangeListener = useCallback((_event: ResultListSelectionChangedEvent) => {
    setSelectedFeatures(_event.features);
    setSelectedIds(_event.getFeatureIds());
}, []);

<ResultList resultListInput={input} onSelectionChanged={selectionChangeListener} />
```

### Sorting Data

If you want to sort the data by a single columndate you have to click on the column header. The arrows show in which direction the sorting took place.

## License

Apache-2.0 (see `LICENSE` file)