# @open-pioneer/local-storage

This package provides access to the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

A single local storage key (configurable, see [Configuration](#configuration)) is used to keep track of the application's persisted state.
Packages using the `LocalStorageService` can work with arbitrary values (including nested data structures) through a convenient API.

> NOTE: The `LocalStorageService` will read the persistent state from the browser's local storage on application startup.
> Changes to that state made via the `LocalStorageService` will be reflected in the browser's local storage immediately.
> Concurrent changes made to the browser's local storage **will not** be reflected by the `LocalStorageService`.
> In other words, there is no two-way synchronization between the two systems while the application is running.

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

TODO: More details

Because the browser's local storage is a shared resource, you should take some precautions to avoid collisions with keys used by other packages.

You can use a namespace to manage a group of related values with a common prefix (for example, the package name).
Behind the scenes, the `LocalStorageService` will create an object for that namespace.

Example:

```jsx
const storageService = ...; // injected
const namespace = storageService.getNamespace("my-package-name");
namespace.set("foo", "bar"); // actually sets `"my-package-name" -> "foo"`
```

### Configuration

| Name        | Type   | Description                                                                                                                                                                                                                     |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storageId` | String | The key under which the serialized state will be saved. This value should be configured to reasonably unique value to avoid clashes with other applications under the same origin. Defaults to `trails-state` (with a warning). |

### Implementation notes

TODO: Single large object

## License

Apache-2.0 (see `LICENSE` file)
