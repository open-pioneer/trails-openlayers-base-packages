---
"@open-pioneer/search": patch
---

Pass the map in the `SearchOptions` to an `SearchSource` when a search is triggered. This allows to improve the search using information from the map (e.g. only search for results in the current map extent).
