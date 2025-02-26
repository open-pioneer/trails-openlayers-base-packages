# @open-pioneer/scale-setter

This package provides a UI component to change the scale of the map.

## Usage

To integrate the scale-setter into your app, insert the following snippet (and reference a map):

```jsx
<ScaleSetter
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

To configure custom scales, provide the optional `scales` prop (a `number[]`) to the component.
By default, scale options are taken from the [standard levels by AdV](https://www.adv-online.de/AdV-Produkte/Standards-und-Produktblaetter/AdV-Profile/binarywriterservlet?imgUid=36060b99-b8c4-0a41-ba3c-cdd1072e13d6&uBasVariant=11111111-1111-1111-1111-111111111111).

```jsx
<ScaleSetter
    map={map}
    scales={[
        336, 671, 1343, 2685, 5371, 10741, 21478, 42941, 85819, 171384, 341757, 679450, 1342389,
        2651369
    ]}
/>
```

## License

Apache-2.0 (see `LICENSE` file)
