# User Interface Guidelines

Guidelines for React components developed in this repository.

## General

-   Every component root-element must have a reasonable CSS class (e.g. `scale-viewer`)
    -   Complex components with many children must also assign classes to those children (e.g. list items, buttons, sections)
-   Every component receives an extra `className` prop (optional string) that can be customized by the user
    -   The css classes in `className` are simply added to the predefined classes
-   For components that simply wrap another HTML/Chakra-Element (such as a button):
    -   Use [`forwardRef`](https://react.dev/reference/react/forwardRef) to make the inner component accessible to the outside. This can be important for being able to call `.focus()`, for example.
    -   Consider accepting all properties of the wrapped components
-   Prefer chakra components where available in favor of "plain" HTML elements
    -   otherwise Chakra theming might not be applied
    -   it is good practice to wrap a new React component with a Chakra component (like Box)
-   Do not use specific colors or font (sizes) in components
    -   see **Theming** below
-   Components should be usable in different widths and heights
    -   Do not use specific width and height in components
    -   Components should use 100% of the parents width
    -   Exceptions: width and height of icons, etc.
-   If a new React component requires a value that is not part of the predefined semantic tokens, it must be stated in the documentation of the component
    -   provide a default value in this case; the component must still work if the additional semantic token is missing
-   Components should be embeddable "anywhere" (with reasonable restrictions)
    -   Individual components do not control their own visibility (e.g. no close button _in general_)
    -   Do not specify max size / min size: let the user control the outer layout
    -   In general: do not implement scrolling yourself, unless it makes sense to do so
-   "Tool"-Buttons:

    -   Use the `ToolButton` component from `@open-pioneer/react-utils`
    -   The label must be an i18n-string (might be same like aria-label)
    -   Snippet:
        ```jsx
        <ToolButton label={someLabel} icon={<SomeIcon />} onClick={someEventHandler} />
        ```

-   Tooltips (yaml / i18n)
    -   Start with a capital letter at the beginning across languages (e.g. "Zoom in", "Vergrößern")

## Mobile / Responsive Design

-   Use flexbox layout to resolve simple responsive design issues
-   Test with different screen sizes: ensure sensible behavior

## Documentation and Examples

-   Create a Demo / Samples for components
-   Use the open layers sample app as a showcase with many components
-   Create a separate sample app for complex components

-   Maintain a high level document explaining the UI-Concept
    -   Embedding of components
    -   Controlling visibility (e.g. show / hide)
    -   Supported customization

## Theming

-   The Chakra theming mechanism allows to define a theme for each component. However, the aim is to create a base theme that allows to change the styles of an app easily by changing specific variable values instead of re-styling each component separately. For each Chakra component the base theme has to define the component's styles using well-defined specific variables. The base theme will be created step-by-step for each component that is used in the examples and components of the trails-openlayers-base-packages. For simplicity, the base theme will be developed in the `map-sample` of the trails-openlayers-base-packages.
    -   Make sure that all Chakra components used in the implementation do have a definition in the map-samples theme (https://chakra-ui.com/docs/styled-system/component-style)
    -   Do not use specific colors or font (sizes) in components. If you need different variants of styles for one component us `variants` instead.
        -   e.g. Buttons: Use the pre-defined variants to style buttons.
