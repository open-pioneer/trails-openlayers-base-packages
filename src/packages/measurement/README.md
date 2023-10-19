# @open-pioneer/measurement

This package provides a UI component that allows the user to perform area and distance measurements on the map.

The UI contains a dropdown to switch between distance and area measurements and a button to delete all current measurements. The measurement unit is automatically selected appropriately.

### Distance measurement

"Distance" can be selected from the dropdown in the UI to measure the length of distances in the map by drawing a line.

### Area measurement

"Area" can be selected from the dropdown in the UI to measure the size of areas in the map by drawing a polygon.

## Usage

To integrate the measurement in your app, insert the following snippet and reference a map ID:

```tsx
<Measurement mapId="map_id"></Measurement>
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
