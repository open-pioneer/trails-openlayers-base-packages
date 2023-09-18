# @open-pioneer/react-utils

React utilities for open pioneer trails applications.

## Titled Sections

Use the `<TitledSection>` and `<SectionHeading>` components instead of raw `hX` html tags.
This way, the appropriate heading level can be determined automatically.

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

## Hooks

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
