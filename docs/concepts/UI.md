# User Interface Concept

Chakra UI is used for all React UI components.

More information: [Chakra UI](https://chakra-ui.com/)

## App layout

trails-openlayers-base-packages will not provide any app layout.
Only predefined and customizable map anchors are implemented and can be used by the developer to place components directly on the map.

More information: [API documentation](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/docs/modules/_open_pioneer_map.html#md:map-anchor-component)

## Customize components

All trails-openlayers-base-packages components offer various options to customize the components.

### CSS class names

All components have a css class on their root element (mostly the component name, e.g. `scale-viewer`)
that can be used to identify the component when writing own css.
Additionally, all components allow to pass custom css classes to the component using the
`className`.
Those css classes will be appended to the default class name when the component is being rendered.

**Example**

Add class name `my-class` to the component:

```tsx
<ScaleViewer map={map} className="my-class" />
```

Renders as (for example):

```html
<div data-theme="light" class="scale-viewer my-class ...">
    <!-- ... -->
</div>
```

### React `forwardRef`

If a component is a simple wrapper around another DOM element (such as a button), it will provide a reference to the underlying DOM element via `forwardRef`.
You can use the `ref` property on the component to access the DOM element.

**Example**

```tsx
// YOUR-APP/AppUI.tsx
const zoomButton = useRef<HTMLButtonElement>(null);

/* later, for example in an event handler */
zoomButton.current!.focus()

return (
    {/* ... */}
    <ZoomIn map={map} ref={zoomButton} />
    {/* ... */}
);
```

More information: [React `forwardRef`](https://react.dev/reference/react/forwardRef)
