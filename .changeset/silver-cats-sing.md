---
"@open-pioneer/toc": patch
---

The behavior of `initiallyCollapsed` if `collapsibleGroups` is set to `false` has been fixed. Previously, using `intiallyCollapsed` elements could be collapsed even though collapsing was disabled. `initiallyCollapsed` now only takes effect when `collapsibleGroups` is `true`. To hide elements, use list mode instead.
