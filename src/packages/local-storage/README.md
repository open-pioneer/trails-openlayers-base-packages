# @open-pioneer/local-storage

This package provides access to the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

A single local storage key (configurable, see [Configuration](#configuration)) is used to keep track of the application's persistent data.
Packages using the `LocalStorageService` can work with arbitrary values (including nested data structures) through a convenient API.

> NOTE: The `LocalStorageService` will read the persistent data from the browser's local storage on application startup.
> Changes to that data made via the `LocalStorageService` will be reflected in the browser's local storage immediately.
> Concurrent changes made to the browser's local storage **will not** be reflected by the `LocalStorageService`.
> In other words, there is no two-way synchronization between the two systems while the application is running.
>
> You should not attempt to modify the local storage value managed by the `LocalStorageService` (see `storageId` in [Configuration](#configuration)) through the "raw" Browser APIs while the application is running.
> Other keys are safe to use.

## Usage

Reference the interface name `local-storage.LocalStorageService` to inject an instance of `LocalStorageService`.

### Checking for local storage support

Not all browsers implement or enable support for local storage.
Use the `.isSupported` property to check whether local storage can be used at all:

```js
const storageService = ...; // injected
console.log(storageService.isSupported);
```

If local storage is not supported, other methods (such as `get()` and `set()`) will throw an error.

### Reading and writing values

In its most basic form, you can use the `LocalStorageService` similar to a map.
In the background, changes to the service will always be persisted into local storage.

All keys and values used in the `LocalStorageService` will be serialized to JSON via `JSON.stringify()`.
Thus, only values supported by JSON can be used.

Example:

```js
const storageService = ...; // injected
storageService.set("foo", "bar");
storageService.set("foo", ["array"]);
storageService.set("foo", {
    nested: {
        object: "hello world"
    }
});
storageService.get("foo"); // returns (copy of) previous value
storageService.remove("foo");
storageService.clear();
```

### Namespaces

You can use the `LocalStorageService` to manage hierarchical data, including objects and arrays (see above).
_Namespaces_ can help you treat an object as a group of (nested) properties.
Getting or setting entries in the namespace will update an object behind the scenes.

To use a namespace, call `getNamespace(key)` on either the `LocalStorageService` or another `LocalStorageNamespace` object.
The `key` used in `getNamespace(key)` should either already be associated with an object or it should not be set to a value at all.
If `key` is not yet associated with an existing object, a new empty object will be created.

Example:

```js
const storageService = ...; // injected
const namespace = storageService.getNamespace("my-key");
namespace.set("foo", "bar"); // actually sets `"my-key" -> "foo"`
```

`getNamespace("my-key")` returns a `LocalStorageNamespace` instance that manipulates the object at `"my-key"`.

Namespaces provide a convenient way to scope your component's persistent values, avoiding conflicts with other packages.
For example, you can use your package name as the namespace key:

```js
const storageService = ...; // injected
const namespace = storageService.getNamespace("my-package-name");
namespace.set("my-state", "some-value-to-save");
```

> NOTE: Multiple namespace instances using the same `key` will manipulate the same object and see each other's effects.

### Configuration

| Name        | Type   | Description                                                                                                                                                                                                                   |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storageId` | String | The key under which the persistent data will be saved. This value should be configured to a reasonably unique value to avoid clashes with other applications at the same origin. Defaults to `trails-state` (with a warning). |

### Implementation notes

The `LocalStorageService` manages the persistent data as a single, hierarchical JSON object.
This JSON object is loaded from and saved to the browser's local storage using the `storageId` key.

The top level value is always an object; its properties are manipulated when calling `get`, `set` etc. on the `LocalStorageService`.
Nested values can be arbitrary (JSON-compatible) values.

## License

Apache-2.0 (see `LICENSE` file)
