---
"@open-pioneer/result-list": minor
---

Added a new optional parameter `memoizeRows` to improve render performance.
When rows are memoized, they are only rerendered under certain conditions (e.g. selection changes, sort order changes), which can
greatly improve performance in some circumstances.

Example:

```tsx
<ResultList mapId={mapId} input={input} memoizeRows={true} />
```
