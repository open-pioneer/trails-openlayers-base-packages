---
"@open-pioneer/map": major
---

**Breaking:** Remove old event API from layer types and the map model. These were only used for the `"destroy"` event.

The destroy event still exists, but is now based on the event system of the [reactivity API](https://github.com/conterra/reactivity/tree/main/packages/reactivity-events):

```ts
import { on } from "@conterra/reactivity-events";

const layer = ...;
on(layer.destroyed, () => {
    console.debug("layer was destroyed");
});

const mapModel = ...;
on(mapModel.destroyed, () => {
    console.debug("layer was destroyed");
});
```
