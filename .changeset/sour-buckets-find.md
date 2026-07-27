---
"@open-pioneer/search": minor
---

The `onSelect` callback now receives an additional property `trigger` (`"user"` or `"api-select"`) support different reactions based on the way a result was selected:

- `user` indicates that event was triggered by the end user
- `api-select` indicates that the selection was made via the API (i.e. `searchAndSelect`).
