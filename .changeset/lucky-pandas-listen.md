---
"@open-pioneer/search": patch
---

Refactor the internal state management of the search component: the widget state now lives in a
long lived, reactive view model instead of react state. This is an internal change; the component's
properties, events and behavior are unchanged.
