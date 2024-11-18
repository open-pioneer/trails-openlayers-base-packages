# @open-pioneer/coordinate-search

This package provides a UI component to search for coordinates in the map or have an input field for coordinates.

## Usage Coordinate search

To integrate the coordinate search in your app, insert the following snippet:

```jsx
<CoordinateSearch />
```

To define the selectable projections, set the optional `projections` property:

```jsx
<CoordinateSearch
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

In case of the `onSelect` event, you can access the entered coordinate from the parameter `CoordinatesEvent`. The `onSelect` event gets called if you enter the input or if there is input and you select a projection.

With the `onClear` option, you can set a callback function that gets called if the clear button is clicked.

```tsx
<CoordinateSearch
    onSelect={(event: CoordsSelectEvent) => {
        // do something
    }}
    onClear={() => {
        // do something
    }}
/>
```

## Usage Coordinate input

To integrate the coordinate input component in your app, insert the following snippet:

```jsx
<CoordinateInput />
```

To define the selectable projections, set the optional `projections` property:

```jsx
<CoordinateInput
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

To set the value of the input field from outside the component,
set the optional `input` property from type Coordinate.
The Coordinates have to be in the projection of the map.
If the value changes, the `onSelect` function is triggered.

```jsx
<CoordinateInput input={[761166, 6692084]} />
```

To set the placeholder of the input field from outside the component,
set the optional `placeholder` property from type Coordinate or string.
The Coordinates have to be in the projection of the map. Common usage for the string is "Enter coordinates here" or for the Coordinate the current mouse position.

```jsx
<CoordinateInput placeholder={[700000, 6000000]} />
<CoordinateInput placeholder={"Enter coordinates here"} />
```

### Listening to events

To listen to the events `onSelect` and `onClear`, provide optional callback functions to the component.

In case of the `onSelect` event, you can access the entered coordinate from the parameter `CoordinatesEvent`. The `onSelect` event gets called if you enter the input or if there is input and you select a projection.

With the `onClear` option, you can set a callback function that gets called if the clear button is clicked.

```tsx
<CoordinateInput
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
