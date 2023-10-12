# @open-pioneer/map-navigation

This package provides a collection of map-navigation controls:

-   Initial extent (a button that allows the user to reset the map to the initial view)
-   Zoom (two buttons that allow the user to zoom in and zoom out of the map)

## Usage initial extent

To integrate the component in your app, insert the following snippet and reference a map ID:

```jsx
<InitialExtent mapId="map_id" />
```

## Usage zoom

To integrate the component in your app, insert the following snippet and reference a map ID:

```jsx
<ZoomIn mapId="map_id" />
<ZoomOut mapId="map_id" />
```

You can also use the generic `Zoom` component:

```jsx
<Zoom mapId="map_id" zoomDirection="in" />
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
