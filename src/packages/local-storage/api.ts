// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Provides access to the browser's local storage for trails packages.
 * Use the interface name `"local-storage.LocalStorageService"` to inject an instance of this interface.
 */
export interface LocalStorageService extends LocalStorageNamespace {
    /**
     * Whether local storage is supported by the current environment.
     *
     * Getters and setters working on local storage will throw if this value is `false`.
     */
    readonly isSupported: boolean;
}

/**
 * Provides basic operations to interact with the browser's local storage.
 */
export interface LocalStorageNamespace {
    /**
     * Returns the value associated with the given `key`, or `undefined` if
     * no such value exists.
     */
    get(key: string): unknown;

    /**
     * Associates the given `value` with `key`.
     * TODO: which values are possible?
     * TODO: clone value
     */
    set(key: string, value: unknown): void;

    /**
     * Removes any value associated with `key`.
     */
    remove(key: string): void;

    /**
     * Removes all entries associated with this storage namespace (including nested namespaces).
     */
    removeAll(): void;

    /**
     * Returns a nested storage namespace with the given prefix.
     *
     * Namespaces can be used to group multiple entries together.
     * They are implemented as objects and appear as such when retrieved from their parent.
     * Getting or setting a property on a namespace will modify these objects.
     *
     * Example:
     *
     * ```js
     * const storageService = ...; // injected
     * const packageNamespace = storageService.getNamespace("my-package-name");
     * packageNamespace.set("foo", "bar"); // actually sets `"my-package-name" -> "foo"`
     * ```
     */
    getNamespace(prefix: string): LocalStorageNamespace;
}

/** Package properties of the `"local-storage"` package. */
export interface LocalStorageProperties {
    /** The root local storage key used to store application state. */
    storageId: string | null;
}

import "@open-pioneer/runtime";
declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "local-storage.LocalStorageService": LocalStorageService;
    }
}
