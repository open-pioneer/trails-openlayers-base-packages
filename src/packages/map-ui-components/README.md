# @open-pioneer/map-ui-components

This package contains ui components that can used together with the map.

## Tool buttons

To create a simple icon button with a tooltip and an `aria-label`, use the `ToolButton` component as in the following sample:

```jsx
<ToolButton label={someLabel} icon={<SomeIcon />} onClick={someEventHandler} />
```

This component is used to add an icon button to the map.

## Tooltip box

The `TooltipBox` component is a simple `Box` that is styled like a chakra tooltip.
Its styles are derived from the current chakra theme (the `tooltip` recipe).
It is useful to place tooltip-like messages at a custom location, for example on the map:

```jsx
<TooltipBox>Click on the map to start drawing.</TooltipBox>
```

`TooltipBox` accepts all `Box` props.
Additional styles can be applied via the `css` prop (or any other chakra style prop).
The rendered element always has the css class `tooltip-box`.

## License

Apache-2.0 (see `LICENSE` file)
