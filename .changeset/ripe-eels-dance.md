---
"@open-pioneer/search": minor
---

Introduce search API and `resetInput` method

The search API allows programmatic access to the search component.
Currently, it provides a method to reset the search input field.

The API can be accessed by listening to the `onReady` event of the search Component, which provides the `SearchApi` as a parameter once the search component is ready to use.
To programmatically clear the search input, call the `resetInput` method on the retrieved API object.
An example of how to use the search API is provided in the README.md.
