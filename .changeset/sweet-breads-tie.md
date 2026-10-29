---
"@open-pioneer/toc": patch
---

Nested children are not rendered until they become visible for the first time (lazy mount).
This improves performance in applications with lots of nested layers.

As a side effect, the `tocItem.htmlElement` of those children will not be initialized until they have been mounted.
Please file an issue if you encounter any problems with this change.
