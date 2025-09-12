---
"@open-pioneer/map-test-utils": major
---

Deprecate `createServiceOptions()` function.

This function was previously used in tests to mock the map registry for a react component under test.
This is no longer necessary because our react components now receive the map model directly (no lookup is done anymore).
