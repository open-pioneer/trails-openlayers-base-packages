# @open-pioneer/geolocation

This package provides a geolocation component based on [OpenLayers](https://openlayers.org/en/latest/apidoc/module-ol_Geolocation-Geolocation.html) to locate a user's position.

## Usage

To add the component to your app, insert the following snippet (with a reference to a map):

```jsx
<Geolocation
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

If the position was determined successfully, the map is centered on the user's position and zoomed to the accuracy of the position.
If the position is updated, the map is centered again.

Once a user zooms or moves the map, the map is no longer centered on new positions.

To adjust the maximum zoom level, add the optional property `maxZoom`.

```jsx
<Geolocation map={map} maxZoom={20} />
```

To configure the style of the user's position and accuracy, add the optional properties `positionFeatureStyle` or `accuracyFeatureStyle`:

```tsx
<Geolocation map={map} positionFeatureStyle={...} accuracyFeatureStyle={...} />
```

Both properties support arbitrary OpenLayers [`StyleLike`](https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html#~StyleLike) values: you can configure either a single [Style](https://openlayers.org/en/latest/apidoc/module-ol_style_Style.html) instance, an array of them or a function computing such values.

```tsx
import { Geolocation } from "@open-pioneer/geolocation";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

const POSITION_STYLE = new Style({
    image: new CircleStyle({
        radius: 6,
        fill: new Fill({
            color: "#91CC33"
        }),
        stroke: new Stroke({
            color: "#FFF",
            width: 3
        })
    })
});

const ACCURACY_STYLE = new Style({
    stroke: new Stroke({
        color: "#91CC33",
        width: 3
    }),
    fill: new Fill({
        color: "rgba(0, 0, 255, 0.05)"
    })
});

function AppUI() {
    return (
        // ...
        <Geolocation
            map={map}
            positionFeatureStyle={POSITION_STYLE}
            accuracyFeatureStyle={ACCURACY_STYLE}
        />
    );
}
```

To use custom position options from the [Geolocation API](https://www.w3.org/TR/geolocation/#position_options_interface), add the optional property `trackingOptions`.
Changing the tracking options at runtime stops the current geolocation, so keep the object stable (for example with `useMemo` or a constant outside the render function).

```jsx
<Geolocation
    map={map}
    trackingOptions={useMemo(
        {
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 600000
        },
        []
    )}
/>
```

### Notification

To show user notifications, add the `@open-pioneer/notifier` to your app.

## License

Apache-2.0 (see `LICENSE` file)
