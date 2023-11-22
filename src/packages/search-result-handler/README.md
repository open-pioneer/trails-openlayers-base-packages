# @open-pioneer/search-result-handler

The resultHandler method adds a marker or highlight for the search result geometries on the map. It centers the map to the position of the results and zoom to their extent. Markers or highlights are removed when new search is performed or text search is reset.

## Usage

To use the method, configure an open layers map and the result geometries.

```jsx
resultHandler(olMap, resultGeometries, {});
```

The following optional properties can be configured: `highlightStyle` to have specific styles for the marker and highlights, `zoomScaleForPoints` and `zoomScaleForLinesOrPolygons` no to zoom the map further than these scales.

## License

Apache-2.0 (see `LICENSE` file)
