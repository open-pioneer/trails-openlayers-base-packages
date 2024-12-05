---
"@open-pioneer/map": minor
---

**Breaking:** Remove most events from the map model and the layer interfaces.
All events that were merely used to synchronized state (e.g. `changed:title` etc.) have been removed.

The map model and related objects (layers, layer collections, etc.) are now based on the [Reactivity API](https://github.com/conterra/reactivity/blob/main/packages/reactivity-core/README.md).
This change greatly simplifies the code that is necessary to access up-to-date values and to react to changes.

For example, from inside a React component, you can now write:

```jsx
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

function YourComponent() {
    // Always up to date, even if the layer's title changes.
    // No more need to listen to events.
    const title = useReactiveSnapshot(() => layer.title, [layer]);
    return <div>{title}</div>;
}
```

And inside a normal JavaScript function, you can watch for changes like this:

```js
import { watch } from "@conterra/reactivity-core";

const watchHandle = watch(
    () => [layer.title],
    ([newTitle]) => {
        console.log("The title changed to", newTitle);
    }
);

// Later, cleanup:
watchHandle.destroy();
```

For more details, check the [Reactivity API documentation](https://github.com/conterra/reactivity/blob/main/packages/reactivity-core/README.md).
