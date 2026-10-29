---
"@open-pioneer/toc": patch
---

Only hide layers that are actually shown in the component when triggering the "hide all layers" action.
Before this change, layers not shown in the TOC (`internal`, `listMode: hide`, etc.) were also hidden.
