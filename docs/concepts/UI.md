# User Interface Concept

Chakra UI is used for all React UI components.

More information: [Chakra UI](https://chakra-ui.com/)

## App layout

trails-openlayers-base-packages will not provide any app layout. Only predefined and customizable map 
anchors are implemented and can be used by the developer to place components directly on the map.

More information: [API documentation](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/docs/modules/_open_pioneer_map.html#md:map-anchor-component)

## Customize components

All trails-openlayers-base-packages components offer various options to customize the components.

### CSS class names

All components have a css class on the root element (mostly the component name, e.g. `scale-viewer`)
that can be used to identify the component when writing own css. 
Additionally, the all components  allow to pass multiple css class names to the component using the 
`className` prop that will be appended to the component.

**Example**

Add class name "css" to the component: 
```tsx
<ScaleViewer mapId={MAP_ID} className="css"></ScaleViewer>
```

### React `forwardRef`

All components are wrapped into a simple HTML element to expose the DOM element using `forwardRef`, that can be access with `useRef` / `ref` from the parent component.

**Example**

```tsx
// YOUR-APP/MapApp.tsx
const scaleViewerRef = useRef<HTMLDivElement>(null);

return (
    {/* ... */}
    <ScaleViewer mapId={MAP_ID} ref={scaleViewerRef}></ScaleViewer>;
    {/* ... */}
);
```

More information: [React `forwardRef`](https://react.dev/reference/react/forwardRef)

## TODO

-   add documentation for Chakra UI theming
