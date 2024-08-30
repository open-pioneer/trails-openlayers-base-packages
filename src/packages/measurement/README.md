# @open-pioneer/measurement

This package provides a UI component that allows the user to perform area and distance measurements on the map.

The UI contains a dropdown to switch between distance and area measurements and a button to delete all current measurements. The measurement unit is automatically selected appropriately.

## Usage

To integrate the measurement in your app, insert the following snippet and reference a map ID:

```tsx
<Measurement mapId="map_id" />
```

### Configuring feature styles

To configure the style of the features drawn on the map, configure the optional `activeFeatureStyle` (for features that are currently being drawn) or `finishedFeatureStyle` (for completed features) properties:

```tsx
<Measurement mapId="map_id" activeFeatureStyle={...} finishedFeatureStyle={...} />
```

Both properties support arbitrary OpenLayers [`StyleLike`](https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike) values: you can configure either a single [Style](https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html) instance, an array of them or a function computing such values.

As an example, the following configuration will render completed features using black color and active ones using red color:

```tsx
import { Fill, Stroke, Style } from "ol/style";
import { Measurement } from "@open-pioneer/measurement";

const BLACK_STYLE = new Style({
    stroke: new Stroke({
        color: "black",
        width: 5
    }),
    fill: new Fill({
        color: "rgba(0, 0, 0, 0.25)"
    })
});

const RED_STYLE = new Style({
    stroke: new Stroke({
        color: "red",
        width: 5
    }),
    fill: new Fill({
        color: "rgba(255, 0, 0, 0.25)"
    })
});

function AppUI() {
    return (
        // ...
        <Measurement
            mapId={MAP_ID}
            activeFeatureStyle={RED_STYLE}
            finishedFeatureStyle={BLACK_STYLE}
        />
    );
}
```

### Adding predefined measurements

The optional property `predefinedMeasurements` can be used to add predefined measurement geometries (line strings and polygons).
The predefined measurements will have the same style and tooltip as measurements created by a user.

Note that predefined measurements are re-applied when the array changes.
To prevent accidental updates, wrap the array in a `useMemo` hook or store it somewhere outside the render function.

```tsx
import LineString from "ol/geom/LineString";
import { MeasurementGeometry } from "@open-pioneer/measurement/MeasurementController";

const measurements = useMemo(
    () => [
        new LineString([
            [398657.97, 5755696.26],
            [402570.98, 5757547.78]
        ])
    ],
    []
);

<Measurement predefinedMeasurements={measurements} />;
```

### Listen for changes

The optional property `onMeasurementsChange` can be used to register an event handler function.
This function is called whenever the set of measurements changes (i.e. add or remove actions).

Changes include both user actions or updates triggered by `predefinedMeasurements`.
Unmounting the component will not trigger a change event.

```tsx
// outputs either add-measurement or remove-measurement and the measurement geometry
<Measurement onMeasurementsChange={(e) => console.log(e.kind, e.geometry)} />
```

## License

Apache-2.0 (see `LICENSE` file)
