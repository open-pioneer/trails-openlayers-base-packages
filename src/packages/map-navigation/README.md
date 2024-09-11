# @open-pioneer/map-navigation

This package provides a collection of the following map navigation controls:

-   [Initial extent](#initial-extent): A button that allows the user to reset the map to the initial view.
-   [Zoom](#zoom): Two buttons that allow the user to zoom in and zoom out of the map.

## Usage

### Initial extent

To integrate the component in your app, insert the following snippet and reference a map ID:

```jsx
<InitialExtent mapId="map_id" />
```

### Zoom

To integrate the component in your app, insert the following snippet and reference a map ID:

```jsx
<ZoomIn mapId="map_id" />
<ZoomOut mapId="map_id" />
```

You can also use the generic `Zoom` component:

```jsx
<Zoom mapId="map_id" zoomDirection="in" />
```

If you don't want to allow zooming, while the animation is not finished,
you can prohibit it by setting the `disableWhileAnimating` prop to `true`.
This is also interesting if you want the user to only zoom between static scales and not in between.

```jsx
<Zoom mapId="map_id" zoomDirection="in" disableWhileAnimating={true} />
```

## License

Apache-2.0 (see `LICENSE` file)
