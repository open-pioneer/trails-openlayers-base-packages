# @open-pioneer/map-navigation

This package provides a collection of the following map navigation controls:

-   [Initial extent](#initial-extent): A button that allows the user to reset the map to the initial view.
-   [Zoom](#zoom): Two buttons that allow the user to zoom in and zoom out of the map.
-   [Navigate History Forward and Backward](#navigate-history-forward-and-backward): Two separate buttons that allow the user to navigate in the history of map views (e.g. jump back to previous map extent).

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

### Navigate History Forward and Backward

To integrate the component in your app, insert the following snippet and reference a view Model:

```jsx
const viewModel = new ViewHistoryModel(map);

// Later ...
<NaviHistoryBackward viewModel={viewModel} />
<NaviHistoryForward viewModel={viewModel} />
```

## License

Apache-2.0 (see `LICENSE` file)
