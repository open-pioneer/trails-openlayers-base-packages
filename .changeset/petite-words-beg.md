---
"@open-pioneer/map": minor
"@open-pioneer/map-test-utils": minor
---

The map initialization has been adjusted to fix the map view initialization if initial view is configured with extent.
This change affects the order and timing of the map's initialization.

The timing changes might affect early map interactions or tests:
To wait until the map is actually being rendered (and thus fully initialized), you can use the map model's existing `whenDisplayed()` method.
The new test helper function `waitForMapRender` is provided from (`@open-pioneer/map-test-utils`) to wait in tests for the map view to be completely initialized.
