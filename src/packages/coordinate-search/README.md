# @open-pioneer/coordinate-search

This package provides a UI component to search for coordinates in the map.

## Usage

To integrate the coordinate search in your app, insert the following snippet and reference a map ID:

```jsx
<CoordinateSearch mapId="map_id" />
```

To define the selectable projections, set the optional `projections` property:

```jsx
<CoordinateSearch
    mapId="map_id"
    projections={[
        {
            label: "EPSG:25832",
            value: "EPSG:25832"
        },
        {
            label: "WGS 84",
            value: "EPSG:4326"
        },
        {
            label: "Web Mercator",
            value: "EPSG:3857"
        }
    ]}
/>
```

### Listening to events

To listen to the events `onSelect` and `onClear`, provide optional callback functions to the component.
In case of the `onSelect` event, you can access the entered coordinate from the parameter `CoordsSelectEvent`. The `onSelect` event gets called if you enter the input or if there is input and you select an projection.
With the `onSelect` option, you can set an callback function that gets called if the clear button is clicked.

```tsx
<CoordinateSearch
    mapId="map_id"
    onSelect={(event: CoordsSelectEvent) => {
        // do something
    }}
    onClear={() => {
        // do something
    }}
/>
```

## License

Apache-2.0 (see `LICENSE` file)
