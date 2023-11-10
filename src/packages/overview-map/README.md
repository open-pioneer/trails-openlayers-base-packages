# @open-pioneer/overview-map

This package provides a UI component to integrate an overview map which helps to have a better overview of the current location in the map.

## Usage

To integrate the overview map in your app, add the component with a map ID and configure a layer which will be shown in the overview map:

```jsx

const overviewMapLayer = ... // an OpenLayers layer, see below
<OverviewMap mapId="map_id" olLayer={overviewMapLayer} />;
```

### Configuring the layer

The `OverviewMap` requires an OpenLayers `Layer` object in the `olLayer` prop, for example:

```jsx
// Layer construction is wrapped in useMemo to avoid needless reconstructions on render.
// You can also use a service or different shared state to construct your layer.
const overviewMapLayer = useMemo(
    () =>
        new TileLayer({
            source: new OSM()
        }),
    []
);

// Later ...

<OverviewMap mapId="map_id" olLayer={overviewMapLayer} />;
```

> NOTE: Keep in mind that an OpenLayers `Layer` object should only be used from (at most) a single map.
> This means that the `olLayer` used here should be a new layer instance that is not used anywhere else.
> Most importantly, you cannot (at this time) use an `.olLayer` from the `MapModel` directly.

### Configuring the size

The `OverviewMap` component defines a default size via its `.overview-map` CSS class.
To override the default size, you can, for example, add a custom css class to the `OverviewMap` component and then define your own height or width there.
The children of the map (the actual map view etc.) will resize themselves accordingly.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
