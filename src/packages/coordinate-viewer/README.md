# @open-pioneer/coordinate-viewer

This package provides a UI component to show the current coordinates at the users current mouse position.

## Usage

To integrate the coordinate viewer in your app, insert the following snippet and reference a map ID:

```jsx
<CoordinateViewer mapId="map_id" />
```

To define the number of decimal places shown, set the optional `precision` property:

```jsx
<CoordinateViewer mapId="map_id" precision={2} />
```

To show the coordinates in a specific projection, set the optional `displayProjectionCode` property:

```jsx
<CoordinateViewer mapId="map_id" displayProjectionCode="EPSG:4326" />
```

To show the coordinates in a specific coordinate format, set the optional `format` property (default: `decimal`):

```jsx
<CoordinateViewer mapId="map_id" format="degrees" />
```

## License

Apache-2.0 (see `LICENSE` file)
