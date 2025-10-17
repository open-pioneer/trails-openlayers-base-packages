---
"@open-pioneer/map": major
---

**Breaking:** Remove old event API from layer types. These were only used for the `"destroy"` event.

The destroy event still exists, but is now based on the event system of the reactivity API:

```ts
import { on } from "@conterra/reactivity-events";

const layer = ...;
on(layer.destroyed, () => {
    console.debug("layer was destroyed");
});
```
