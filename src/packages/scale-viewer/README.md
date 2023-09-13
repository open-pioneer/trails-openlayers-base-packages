# @open-pioneer/scale-viewer

This package provides a scale viewer component, which can be integrated besides a map to show the actual map scale.

## Usage

To integrate the scale viewer in your app, insert the following snippet and reference a map id:

```jsx
<ScaleViewer mapId="map_id"></ScaleViewer>
```

### Customizing

The scale viewer component can receive the `className` prop (optional string) that can be used to add additional the css classes of the component.

It is possible to receive a reference to the component using `useRef`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
