# @open-pioneer/react-utils

This package provides React utilities that help a developer create applications.

## Titled sections

Use the `<TitledSection>` and `<SectionHeading>` components instead of raw `hX` HTML tags (such as `<h1>` or `<h2>`).
This way, the appropriate heading level is determined automatically.

Example:

```jsx
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";

function SomeComponent(props) {
    return (
        {/* Renders as h1 if this is the topmost section.
            Title strings are automatically wrapped into `SectionHeading`. */}
        <TitledSection title="Root Title">
            ... Some content ...
            {/* Custom react component as title. Renders as the next level (h2). */}
            <TitledSection title={<SectionHeading size="4xl">Sub Title</SectionHeading>}>
                ... More content ...
            </TitledSection>
        </TitledSection>
    );
}
```

To override the automatic heading level, use the `ConfigureTitledSection` component.
This can be used for example to override the initial heading level or to force a certain level when the React tree differs from the DOM tree.

Example:

```jsx
<ConfigureTitledSection level={2}>
    <TheRestOfYourApplication />
</ConfigureTitledSection>
```

In the preceding example the topmost heading(s) in `TheRestOfYourApplication` start at level 2, and nested headings use increasing levels as usual.
For more details, see the API documentation.

## Hooks

### useCommonComponentProps()

A helper hook that automatically computes `containerProps`: common properties to set on the topmost container element of a public component.

For the time being, these properties are `className` (combined component class and optional additional class names) and `data-testid` (for tests).

Example:

```tsx
// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
// ...

// Inherit from CommonComponentProps
export interface InitialExtentProps extends CommonComponentProps {
    mapId: string;
}

export const InitialExtent: FC<InitialExtentProps> = forwardRef(function InitialExtent(
    props: InitialExtentProps,
    ref: ForwardedRef<HTMLDivElement>
) {
    const { mapId } = props;

    // Use the hook to compute container props (classNames, data-testid, maybe more in the future)
    const { containerProps } = useCommonComponentProps("initial-extent", props);

    // Pass containerProps directly to the container
    return <Box {...containerProps}>{/* ... */}</Box>;
});
```

### useEvent()

The `useEvent` can be used to obtain a stable event handler function with changing implementation.
This is useful to avoid re-triggering `useEffect`-hooks when only the event handler changed.

Example:

```jsx
import { useEvent } from "@open-pioneer/react-utils";

function someReactComponent(props) {
    // NOTE: logMessage() must not be called during rendering!
    const logMessage = useEvent((message: string) => {
        console.log(message, props.someProperty);
    });
    const someService = ...; // injected

    // Changes of prop.someProperty will not cause the effect to re-fire, because the function identity
    // of `logMessage` remains stable.
    useEffect(() => {
        const handle = someService.registerHandler(logMessage);
        return () => handle.destroy();
    }, [someService, logMessage]);
}
```

For more details, see the API docs of `useEvent` or <https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md>.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
