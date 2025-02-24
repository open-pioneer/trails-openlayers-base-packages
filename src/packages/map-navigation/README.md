# @open-pioneer/map-navigation

This package provides a collection of the following map navigation controls:

- [Initial extent](#initial-extent): A button that allows the user to reset the map to the initial view.
- [Zoom](#zoom): Two buttons that allow the user to zoom in and zoom out of the map.
- [Navigate history forward and backward](#navigate-history-forward-and-backward): Two separate buttons that allow the user to navigate in the history of map views (e.g. jump back to previous map extent).

## Usage

### Initial extent

To integrate the component in your app, insert the following snippet (and reference a map):

```jsx
<InitialExtent
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

### Zoom

To integrate the component in your app, insert the following snippet (and reference a map):

```jsx
<ZoomIn map={map} /> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
<ZoomOut map={map} />
```

You can also use the generic `Zoom` component:

```jsx
<Zoom map={map} zoomDirection="in" />
```

### View history forward and backward

To integrate the component in your app, insert the following snippet and reference a view Model:

```jsx
<HistoryBackward map={map} /> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
<HistoryForward map={map} />
```

#### Limitations

The history tools use a shared history of previous map states.
Map states are tracked while at least one history tool is mounted into the application.
If all history tools are unmounted, the history of previous map states is discarded.

## License

Apache-2.0 (see `LICENSE` file)
