# @open-pioneer/overview-map

This package provides a UI component to integrate an overview map which helps to have a better overview of the current location in the map.

## Usage

To integrate the overview map in your app, add the component with reference to a map ID and configure a layer which will be shown in the overview map:

```jsx
//layer configuration example
const OVERVIEW_MAP_LAYER = new TileLayer({
    source: new OSM()
});

<OverviewMap mapId="map_id" layer={OVERVIEW_MAP_LAYER} />;
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
