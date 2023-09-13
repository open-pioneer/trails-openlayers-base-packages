# @open-pioneer/coordinate-viewer

This package provides a coordinate viewer component, which can be integrated besides a map to show the actual coordinates at the current mouse position.

## Usage

To integrate the coordinate viewer in your app, insert the following snippet and reference a map id:

```jsx
<CoordinateViewer mapId="map_id" precision={2}></CoordinateViewer>
```

The optional precision attribute allows to define the number of coordinates' decimal places shown.

### Customizing

It is possible to receive a reference to the underlying DOM node (div) of the CoordinateViewer component using `useRef`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
