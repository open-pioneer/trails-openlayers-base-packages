---
"@open-pioneer/result-list": minor
---

Fix a11y issues:

- add `role=region` and `aria-label` to result list container
- fix wrong `aria-labelledby` ids
- introduce optional property `ariaFeatureProperty` to result list component
    - a feature's property value is used to provide context in aria attributes
        - currently used for `aria-labels` of checkboxes in each row of the data table
    - use feature id as fallback if property is not set or feature does not have the specified property

```tsx
<ResultList ariaFeatureProperty="name" .../>
```
