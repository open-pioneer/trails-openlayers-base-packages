# User Interface Concept

Chakra UI is used for all React UI components.

More information: [Chakra UI](https://chakra-ui.com/)

## App layout

trails-openlayers-base-packages will not provides any app layout. Only predefined and customize map anchor are implemented and can be used by the developer.

More information: [API documentation](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/docs/modules/_open_pioneer_map.html#md:map-anchor-component)

## Customize components

All trails-openlayers-base-packages components offer various options to customize the components.

### CSS class names

All components have a css class on the root element (mostly the component name, e.g. `scale-viewer`) and the options to pass multiple css class names to the component using the `className` prop.

**Example**

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
