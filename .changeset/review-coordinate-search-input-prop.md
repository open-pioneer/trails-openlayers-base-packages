---
"@open-pioneer/coordinate-search": patch
---

`CoordinateInput` compares the `input` prop by content.
Re-rendering the parent with a new array that holds the same coordinates no longer emits another `onSelect` event.
