# @open-pioneer/coordinate-viewer

This package provides a coordinate viewer component, which can be integrated besides a map to show the actual coordinates at the current mouse position.

## Usage

See here a simple integration of a coordinate viewer with a map id and precision (the latter is optional).

```jsx
<CoordinateViewer mapId="map_id" precision={2}></CoordinateViewer>
```

### Customizing

The CoordinateViewer component can receive the `className` prop (optional string) that can be used to add additional the css classes of the component.

It is possible to receive a reference to the component using `useRef`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
