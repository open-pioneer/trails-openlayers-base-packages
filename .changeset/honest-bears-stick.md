---
"@open-pioneer/map": minor
---

Add a new hook `useMapModelValue(props?)`.
The hook returns either the directly configured `map` (via props) or the default map from a parent `DefaultMapProvider`.
If neither is present, an error will be thrown.

This hook is used in all components that work with the map.
The typical usage works like this:

```ts
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";

// optional `map` property inherited from `MapModelProps`
export interface MyComponentProps extends MapModelProps {
    // ... other properties
}

export function MyComponent(props) {
    const map = useMapModelValue(props); // looks up the map
}
```

You can also call this hook without any arguments:

```ts
// Map model from DefaultMapProvider or an error.
const mapModel = useMapModelValue();
```

This hook should replace _most_ usages `useMapModel`, which can't return the map model directly since it may not have finished construction yet.
