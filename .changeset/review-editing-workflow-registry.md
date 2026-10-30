---
"@open-pioneer/editing": patch
---

`EditingService.updateFeature()` no longer blocks the map when the given feature has no id.
The workflow is destroyed immediately in that case.
The next `createFeature()` or `updateFeature()` call for the same map now starts a new workflow instead of throwing "EditingWorkflow already in progress".
