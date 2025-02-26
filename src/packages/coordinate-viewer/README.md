# @open-pioneer/coordinate-viewer

This package provides a UI component to show the current coordinates at the users current mouse position.

## Usage

To integrate the coordinate viewer in your app, insert the following snippet (and reference a map):

```jsx
<CoordinateViewer map={map} />
```

To define the number of decimal places shown, set the optional `precision` property:

```jsx
<CoordinateViewer map={map} precision={2} />
```

To show the coordinates in a specific projection, set the optional `displayProjectionCode` property:

```jsx
<CoordinateViewer map={map} displayProjectionCode="EPSG:4326" />
```

To show the coordinates in a specific coordinate format, set the optional `format` property (default: `decimal`):

```jsx
<CoordinateViewer map={map} format="degree" />
```

## License

Apache-2.0 (see `LICENSE` file)
