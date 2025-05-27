---
"@open-pioneer/spatial-bookmarks": patch
---

## improvements
 - add descriptive `aria-label` to each list item to make it clearer for screenreader users that list item is an interactive element
 - use title in `aria-label` of deleteOne button to provide more context for screenreader users

## known issues
 - screenreaders read both tooltip content and aria label of deleteOne Button
 - descriptive `aria-label` for list items is a workaround 
  - ideally interactive elements should not be nested (deleteOne Button is currently a child of list item)  

