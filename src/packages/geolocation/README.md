# @open-pioneer/geolocation

This package provides a geolocation component based on [OpenLayers](https://openlayers.org/en/latest/apidoc/module-ol_Geolocation-Geolocation.html) to locate a user's position.

## Usage

To add the component to your app, insert the following snippet with a reference to a map ID:

```jsx
<Geolocation mapId="map_id" />
```

To customize the styling for user's position and accuracy, add the optional properties `positionFeatureStyle` and `accuracyFeatureStyle`.

```jsx
<Geolocation
    mapId="map_id"
    positionFeatureStyle={
        new Style({
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
        })
    }
    accuracyFeatureStyle={
        new Style({
            stroke: new Stroke({
                color: "#91CC33",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(0, 0, 255, 0.05)"
            })
        })
    }
/>
```

To used custom position options from the [Geolocation API](https://www.w3.org/TR/geolocation/#position_options_interface), add the optional property `trackingOptions`.

```jsx
<Geolocation mapId="map_id"
    trackingOptions={
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 600000
    }
/>
```

## License

Apache-2.0 (see `LICENSE` file)
