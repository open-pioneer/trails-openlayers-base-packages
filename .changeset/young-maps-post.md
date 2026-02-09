---
"@open-pioneer/map": patch
---

Prevent update of `olMap.padding` by MapContainer if viewPadding did not change.
This caused running map animation to be cancelled.
