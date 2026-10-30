---
"@open-pioneer/feature-editing": patch
---

Fix three bugs in the `FeatureEditor` component:

- The select button remained in its active state after the selection became unavailable (for example because the editable layer was hidden). It is now reset correctly.
- A `radio-group` field stored only the first character of the selected option's `value` (for `valueType: "number"`, only the first digit).
- Clearing a `text-area` field switched the input to an uncontrolled element and logged a React warning.
