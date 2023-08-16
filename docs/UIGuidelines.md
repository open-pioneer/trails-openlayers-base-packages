# User Interface Guidelines

Guidelines for React components developed in this repository.

## General

-   Every component root-element must have a reasonable CSS class (e.g. `scale-viewer`)
    -   Complex components with many children must also assign classes to those children (e.g. list items, buttons, sections)
-   Every component receives an extra `className` prop (optional string) that can be customized by the user
    -   The css classes in `className` are simply added to the predefined classes
-   Wrapper components around simple HTML elements use [`forwardRef`](https://react.dev/reference/react/forwardRef) to expose the wrapped DOM element
-   Prefer chakra components where available in favor of "plain" HTML elements
-   Components should be embeddable "anywhere" (with reasonable restrictions)
    -   Individual components do not control their own visibility (e.g. no close button _in general_)
    -   Do not specify max size / min size: let the user control the outer layout
    -   In general: do not implement scrolling yourself, unless it makes sense to do so

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
