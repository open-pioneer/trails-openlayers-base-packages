---
"@open-pioneer/selection": minor
---

Support reactive changes on the `SelectionSource`'s `status` property using the reactivity API.
**Remove** support for the `changed:status"` event on the selection source: use signals instead.

For example, to implement a `SelectionSource` with changing availability:

```ts
class MySelectionSource implements SelectionSource {
    private _status = reactive("available");

    label = "My selection source";

    get status() {
        return this._status.value;
    }

    someEventHandler() {
        // Change the status by updating the signal's value.
        // The UI will update automatically.
        this._status.value = "unavailable";
    }
}
```
