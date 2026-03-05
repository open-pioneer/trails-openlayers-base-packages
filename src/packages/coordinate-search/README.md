# @open-pioneer/coordinate-search

This package provides a UI component which allow users to search for coordinates in the map and provides component that is an input field for coordinates.

## Usage coordinate search

To integrate the coordinate search in your app, insert the following snippet:

```jsx
<CoordinateSearch
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

### Configuration

To define the selectable projections, set the optional `projections` property:

```jsx
<CoordinateSearch
    map={map}
    projections={[
        {
            label: "EPSG:25832",
            value: "EPSG:25832",
            precision: 2
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

The optional property `precision` allows to specify the number of displayed digits (default: 3).

If no `projections` are specified, the default options are WGS 84 (EPSG:4326) with precision 3 and Web Mercator (EPSG:3857) with precision 2.

### Listening to events

To listen to the events `onSelect` and `onClear`, provide optional callback functions to the component.

In case of the `onSelect` event, you can access the entered coordinate from the parameter `CoordinatesSelectEvent`. The `onSelect` event gets called if a valid input is entered or if the selected projection is changed after entering an input.

With the `onClear` option, you can set a callback function that gets called if the input is cleared.

```tsx
<CoordinateSearch
    map={map}
    onSelect={(event: CoordinatesSelectEvent) => {
        // do something
    }}
    onClear={() => {
        // do something
    }}
/>
```

## Usage coordinate input

To integrate the coordinate input component in your app, insert the following snippet:

```jsx
<CoordinateInput map={map} />
```

### Configure projections

To define the selectable projections, set the optional `projections` property:

```jsx
<CoordinateInput
    map={map}
    projections={[
        {
            label: "EPSG:25832",
            value: "EPSG:25832",
            precision: 2
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

The optional property `precision` allows to specify the number of displayed digits (default: 3).

If no `projections` are specified, the default options are WGS 84 (EPSG:4326) with precision 3 and Web Mercator (EPSG:3857) with precision 2.

### Set the input value

To set the value of the input field from outside the component, set the optional `input` property of type `Coordinate`.

The coordinates have to be in the projection of the map.

If the value changes, the `onSelect` function is triggered (see below).

```jsx
<CoordinateInput map={map} input={[761166, 6692084]} />
```

### Configure the placeholder

To set the placeholder of the input field from outside the component, use the optional `placeholder` property of type `Coordinate` or `string`.

Common usage for a `string` input is a supportive text like "Enter coordinates here".

A `Coordinate` input can be used for example for showing the coordinates of a selected geometry or the current mouse position.

The Coordinates have to be in the projection of the map.

```jsx
<CoordinateInput map={map} placeholder={[700000, 6000000]} />
<CoordinateInput map={map} placeholder={"Enter coordinates here"} />
```

### Listening to events

To listen to the events `onSelect` and `onClear`, provide optional callback functions to the component.

In case of the `onSelect` event, you can access the entered coordinate from the parameter `CoordinatesSelectEvent`. The `onSelect` event gets called if you enter the input, if value of the `input` property changes or if the selected projection is changed after entering an input.

With the `onClear` option, you can set a callback function that gets called if the input is cleared.

```tsx
<CoordinateInput
    onSelect={(event: CoordinatesSelectEvent) => {
        console.log("Coordinates:", event.coords, "Projection:", event.projection);
    }}
    onClear={() => {
        // do something
    }}
/>
```

## License

Apache-2.0 (see `LICENSE` file)
