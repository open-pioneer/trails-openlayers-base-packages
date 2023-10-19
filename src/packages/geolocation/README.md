# @open-pioneer/geolocation

This package provides a geolocation component based on [OpenLayers](https://openlayers.org/en/latest/apidoc/module-ol_Geolocation-Geolocation.html), which can be integrated besides a map to locate a user's position.

## Usage

Simply place the geolocation component somewhere in your react template and add at least the mapId property, so that the geolocation component gets the corresponding map.

See here a simple integration of a geolocation component with a map id:

```jsx
<Geolocation mapId="map_id" />
```

For more configuration of the layer control check `./Geolocation.tsx`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
