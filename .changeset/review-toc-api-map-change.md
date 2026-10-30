---
"@open-pioneer/toc": patch
---

Fix the `TocApi` object staying bound to the previous map when the `map` prop of the `Toc` changes.
The `Toc` now triggers `onDisposed` for the old api and `onReady` with a new api when the map changes.
