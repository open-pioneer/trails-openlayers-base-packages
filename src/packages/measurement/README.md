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

## License

Apache-2.0 (see `LICENSE` file)
