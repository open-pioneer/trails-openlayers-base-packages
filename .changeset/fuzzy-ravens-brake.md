---
"@open-pioneer/result-list": patch
---

Fix a11y issues:

- Fix wrong `aria-labelledby` ids
- Introduce optional property `labelProperty` to result list's `input` option
    - A feature's property value is used to provide context in aria attributes.
      This is currently used for `aria-labels` of checkboxes in each row of the data table.
    - Use feature id as fallback if `labelProperty` is not set or feature does not have the specified property.

```tsx
const input: ResultListInput = {
    columns: columns,
    data: results,
    labelProperty: "name", // uses feature.properties.name as label
    formatOptions: formatOptions
};
```
