# @open-pioneer/scale-bar

This package provides a UI component to show the scale as a line or bar to the user.

## Usage

To integrate the scale as a line in your app, insert the following snippet (and reference a map):

```jsx
<ScaleBar
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

Setting property `displayMode` to `bar`, the scale will be integrated as a bar. By default, or by setting the property to `line`, the scale will be displayed as a line.

```jsx
<ScaleBar map={map} displayMode="bar" />
```

## License

Apache-2.0 (see `LICENSE` file)
