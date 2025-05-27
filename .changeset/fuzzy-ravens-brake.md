---
"@open-pioneer/result-list": minor
"@open-pioneer/selection": patch
---

fix a11y issues in Result List and Selection

## Result List
 - add `role=region` and `aria-label` to result list container
 - fix wrong `aria-labeledby` ids
 - introduce optional property `ariaFeatureProperty` to result list component
   - a feature's property value is used to provide context in aria attributes
     - currently used for `aria-labels` of checkboxes in each row of the data table
   - use feature id as fallback if property is not set or feature does not have the specified property


```tsx
<ResultList ariaFeatureProperty="name" .../>
```

## Selection
- add `aria-description` to select input to ensure that screenreaders read the tooltip of the select interaction
