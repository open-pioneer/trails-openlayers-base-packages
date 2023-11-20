// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ServiceOptions } from "@open-pioneer/runtime";
import { LocalStorageNamespace, LocalStorageProperties, LocalStorageService } from "./api";
import { createLogger, Error } from "@open-pioneer/core";

const LOG = createLogger("local-storage");

const SAVE_TIMEOUT = 0;

const ERROR_IDS = {
    CORRUPTED_DATA: "local-storage:corrupted-data",
    INVALID_PATH: "local-storage:invalid-path",
    INVALID_VALUE: "local-storage:invalid-value",
    NOT_SUPPORTED: "local-storage:not-supported",
    INTERNAL: "local-storage:internal-error"
} as const;

export class StorageServiceImpl implements LocalStorageService {
    #rootKey: string;
    #rootValue: Record<string, unknown> = {};
    #localStorage: Storage | undefined;
    #rootNamespace: StorageNamespaceImpl | undefined;

    constructor(options: ServiceOptions) {
        this.#rootKey = getRootKey(options.properties);
        this.#localStorage = getLocalStorage();
        if (this.#localStorage) {
            this.#load();
            this.#rootNamespace = this.#createRootNamespace();
        }
    }

    destroy() {
        if (this.#saveTimeout) {
            clearTimeout(this.#saveTimeout);
            this.#saveTimeout = undefined;
        }
        if (this.#localStorage) {
            this.#save();
        }
    }

    get isSupported(): boolean {
        return !!this.#rootNamespace;
    }

    get(key: string): unknown {
        return this.#getRootNamespace().get(key);
    }

    set(key: string, value: unknown): void {
        return this.#getRootNamespace().set(key, value);
    }

    remove(key: string): void {
        return this.#getRootNamespace().remove(key);
    }

    clear(): void {
        return this.#getRootNamespace().clear();
    }

    getNamespace(prefix: string): LocalStorageNamespace {
        return this.#getRootNamespace().getNamespace(prefix);
    }

    #saveTimeout: ReturnType<(typeof globalThis)["setTimeout"]> | undefined;
    #triggerSave(): void {
        if (this.#saveTimeout) {
            clearTimeout(this.#saveTimeout);
        }
        this.#saveTimeout = setTimeout(() => {
            this.#saveTimeout = undefined;
            this.#save();
        }, SAVE_TIMEOUT);
    }

    #load() {
        try {
            const storage = this.#localStorage;
            if (!storage) {
                // Should not happen (load is called only when storage is available).
                throw new Error(ERROR_IDS.INTERNAL, "Local storage is not available.");
            }

            const json = storage.getItem(this.#rootKey);
            if (json == null) {
                return; // No previous value
            }

            try {
                const data = JSON.parse(json);
                if (!isObject(data)) {
                    throw new Error(
                        ERROR_IDS.CORRUPTED_DATA,
                        "Persisted value should be an object."
                    );
                }
                this.#rootValue = data;
            } catch (jsonError) {
                LOG.warn("Invalid persisted data, reverting to default", jsonError);
                this.#rootValue = {};
                this.#save();
            }
        } catch (e) {
            LOG.error(`Failed to load from local storage`, e);
        }
    }

    #save() {
        try {
            const storage = this.#localStorage;
            if (!storage) {
                // Should not happen (setting values is only possible if supported).
                throw new Error(ERROR_IDS.INTERNAL, "Local storage is not available.");
            }

            const json = JSON.stringify(this.#rootValue);
            storage.setItem(this.#rootKey, json);
        } catch (e) {
            LOG.error(`Failed to save to local storage`, e);
        }
    }

    #getRootNamespace(): StorageNamespaceImpl {
        const root = this.#rootNamespace;
        if (!root) {
            throw new Error(
                ERROR_IDS.NOT_SUPPORTED,
                "Local storage is not supported by this browser."
            );
        }
        return root;
    }

    #createRootNamespace(): StorageNamespaceImpl {
        const storageAccess: StorageAccess = {
            getByPath: (path) => {
                return getPath(this.#rootValue, path);
            },
            setByPath: (path, value) => {
                if (!isSupportedValue(value)) {
                    throw new Error(
                        ERROR_IDS.INVALID_VALUE,
                        "The value is not supported by local storage."
                    );
                }

                if (path.length === 0) {
                    if (!isObject(value)) {
                        throw new Error(
                            ERROR_IDS.INVALID_VALUE,
                            "The root value must be a plain object."
                        );
                    }
                    this.#rootValue = value;
                } else {
                    setPath(this.#rootValue, path, value);
                }

                this.#triggerSave();
            }
        };
        return new StorageNamespaceImpl([], storageAccess);
    }
}

interface StorageAccess {
    getByPath(path: string[]): unknown;
    setByPath(path: string[], value: unknown): void;
}

class StorageNamespaceImpl implements LocalStorageNamespace {
    private path: string[];
    private access: StorageAccess;

    constructor(path: string[], access: StorageAccess) {
        this.path = path;
        this.access = access;
    }

    get(key: string): unknown {
        return this.access.getByPath([...this.path, key]);
    }

    set(key: string, value: unknown): void {
        this.access.setByPath([...this.path, key], value);
    }

    remove(key: string): void {
        this.access.setByPath([...this.path, key], undefined);
    }

    clear(): void {
        this.access.setByPath(this.path, {});
    }

    getNamespace(key: string): StorageNamespaceImpl {
        return new StorageNamespaceImpl(this.path.concat([key]), this.access);
    }
}

const DEFAULT_KEY = "trails-state";

/**
 * Retrieves the property at `path` from the nested `object`.
 * Returns `object` if path is empty.
 */
function getPath(object: Record<string, unknown>, path: string[]): unknown {
    let current: unknown = object;
    for (const p of path) {
        if (!isObject(current)) {
            throw new Error(
                ERROR_IDS.INVALID_PATH,
                `Cannot get nested property '${p}' because the parent is no object.`
            );
        }
        current = current[p];
    }
    return current;
}

/**
 * Sets the property at `path` in the nested `object` to `value`.
 * Throws an error if the path is empty.
 */
function setPath(object: Record<string, unknown>, path: string[], value: unknown): void {
    if (!path.length) {
        throw new Error(ERROR_IDS.INTERNAL, "Path must not be empty.");
    }

    let current = object;
    for (let i = 0, n = path.length - 1; i < n; ++i) {
        const p = path[i]!;

        let next = current[p];
        if (next === undefined) {
            next = current[p] = {};
        }

        if (!isObject(next)) {
            throw new Error(
                ERROR_IDS.INVALID_PATH,
                `Cannot set property on '${p}' because it is no object.`
            );
        }
        current = next;
    }

    const prop = path[path.length - 1]!;
    current[prop] = value;
}

/**
 * Returns true if `object` is a plain object (or record).
 */
function isObject(object: unknown): object is Record<string, unknown> {
    return !!(object && typeof object === "object" && !Array.isArray(object));
}

/**
 * Returns true if `value` looks like a JSON value.
 */
function isSupportedValue(value: unknown) {
    const type = typeof value;
    return (
        type === "boolean" ||
        type === "number" ||
        type === "string" ||
        type === "undefined" ||
        value === null ||
        Array.isArray(value) ||
        isObject(value)
    );
}

function getRootKey(properties: Partial<LocalStorageProperties>): string {
    const storageId = properties.storageId;
    if (!storageId || typeof storageId !== "string") {
        LOG.warn(
            `The 'storageId' property of the 'local-storage' package should be set to a valid string to avoid collisions with other applications.` +
                ` Defaulting to '${DEFAULT_KEY}'.`
        );
        return DEFAULT_KEY;
    }
    return storageId;
}

function getLocalStorage(): Storage | undefined {
    if (typeof Storage === "undefined") {
        LOG.warn("Local storage is not supported by this browser.");
        return undefined;
    }

    try {
        const storage = globalThis.localStorage;
        if (!storage) {
            LOG.warn("Local storage is not supported by this browser.");
            return undefined;
        }
        return storage;
    } catch (e) {
        LOG.warn("Local storage is not supported by this browser.", e);
        return undefined;
    }
}
