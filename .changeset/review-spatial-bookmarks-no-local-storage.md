---
"@open-pioneer/spatial-bookmarks": patch
---

`SpatialBookmarks` no longer throws when the browser does not support local storage.
Bookmarks are kept in memory for the lifetime of the component in that case and a warning is logged.
