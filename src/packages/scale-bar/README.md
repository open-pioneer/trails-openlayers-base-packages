# @open-pioneer/scale-bar

This package provides a UI component to show the scale as a line or bar to the user.

## Usage

To integrate the scale as a line in your app, insert the following snippet and reference a map ID:

```jsx
<ScaleBar mapId="map_id" />
```

Setting property `displayMode` to `bar`, the scale will be integrated as a bar. By default, or by setting the property to `line`, the scale will be displayed as a line.

```jsx
<ScaleBar mapId="map_id" displayMode="bar" />
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
