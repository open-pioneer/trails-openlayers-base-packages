// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createService } from "@open-pioneer/test-utils/services";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageServiceImpl } from "./StorageServiceImpl";

const MOCKED_STORAGE = new Map<string, string>();

const DEFAULT_STORAGE_ID = "test-storage-id";

beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage();
});

afterEach(() => {
    MOCKED_STORAGE.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

it("Supports local storage by default", async () => {
    const storageService = await setup();
    expect(storageService.isSupported).toBe(true);
});

it("Detects missing local storage", async () => {
    vi.spyOn(window, "localStorage", "get").mockReturnValue(undefined as any);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const storageService = await setup();
    expect(storageService.isSupported).toBe(false);
    expect(warnSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] local-storage: Local storage is not supported by this browser.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);

    expect(() => storageService.get("foo")).toThrowErrorMatchingInlineSnapshot(
        '"local-storage:not-supported: Local storage is not supported by this browser."'
    );
});

it("Reports errors if local storage does not work", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new Error("Some problem!");
    });

    const _storageService = await setup();
    expect(warnSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] local-storage: Local storage is not supported by this browser.",
            [Error: Some problem!],
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("Persists data to local storage", async () => {
    const storageService = await setup();
    storageService.set("foo", "bar");
    storageService.set("answer", 42);
    storageService.set("null", null);
    storageService.set("isAdmin", true);
    storageService.set("array", [1, 2, 3]);
    storageService.set("object", { "baz": "qux" });

    expect(getStorageData()).toMatchInlineSnapshot(`
      {
        "answer": 42,
        "array": [
          1,
          2,
          3,
        ],
        "foo": "bar",
        "isAdmin": true,
        "null": null,
        "object": {
          "baz": "qux",
        },
      }
    `);
});

it("Restores previous data on next run", async () => {
    MOCKED_STORAGE.set(
        DEFAULT_STORAGE_ID,
        JSON.stringify({
            "answer": 42,
            "object": {
                "baz": "qux"
            }
        })
    );

    const storageService = await setup();
    expect(storageService.get("answer")).toBe(42);
    expect(storageService.get("object")).toEqual({
        "baz": "qux"
    });
});

it("Overwrites invalid data on load", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    MOCKED_STORAGE.set(DEFAULT_STORAGE_ID, "garbage");

    const _storageService = await setup();
    expect(getStorageData()).toMatchInlineSnapshot("{}");
    expect(warnSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] local-storage: Invalid persisted data, reverting to default",
            [SyntaxError: Unexpected token g in JSON at position 0],
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("Returns previously set values in get()", async () => {
    const storageService = await setup();
    storageService.set("foo", "bar");
    expect(storageService.get("foo")).toBe("bar");
});

it("Returns undefined for missing values", async () => {
    const storageService = await setup();
    expect(storageService.get("foo")).toBeUndefined();
});

it("Allows removing a key", async () => {
    const storageService = await setup();
    storageService.set("foo", "bar");
    expect(storageService.get("foo")).toBe("bar");

    storageService.remove("foo");
    expect(storageService.get("foo")).toBeUndefined();
});

it("Supports removing all keys", async () => {
    const storageService = await setup();
    storageService.set("foo", "bar");
    storageService.set("answer", 42);
    storageService.clear();

    expect(getStorageData()).toMatchInlineSnapshot("{}");
});

it("Throws for invalid values", async () => {
    const storageService = await setup();
    expect(() => storageService.set("foo", () => 1)).toThrowErrorMatchingInlineSnapshot(
        '"local-storage:invalid-value: The value is not supported by local storage."'
    );
    expect(() => storageService.set("foo", Symbol("symbol"))).toThrowErrorMatchingInlineSnapshot(
        '"local-storage:invalid-value: The value is not supported by local storage."'
    );
    expect(() => storageService.set("foo", BigInt(1))).toThrowErrorMatchingInlineSnapshot(
        '"local-storage:invalid-value: The value is not supported by local storage."'
    );
});

it("Detects missing storage id", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const storageService = await setup({
        storageId: undefined
    });
    expect(storageService.isSupported).toBe(true);
    expect(warnSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] local-storage: The 'storageId' property of the 'local-storage' package should be set to a valid string to avoid collisions with other applications. Defaulting to 'trails-state'.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

describe("nested namespaces", () => {
    it("supports creating a nested namespace", async () => {
        const storageService = await setup();
        const namespace = storageService.getNamespace("toc");
        namespace.set("foo", "bar");

        expect(getStorageData()).toMatchInlineSnapshot(`
          {
            "toc": {
              "foo": "bar",
            },
          }
        `);
    });

    it("supports removing keys", async () => {
        const storageService = await setup();
        const namespace = storageService.getNamespace("toc");
        namespace.set("foo", "bar");
        namespace.set("bar", "baz");
        namespace.remove("foo");

        expect(getStorageData()).toMatchInlineSnapshot(`
          {
            "toc": {
              "bar": "baz",
            },
          }
        `);
    });

    it("clearing a namespace only removes the nested properties", async () => {
        const storageService = await setup();
        storageService.set("outer", 1);

        const namespace = storageService.getNamespace("nested");
        namespace.set("inner", 2);
        namespace.clear();

        expect(getStorageData()).toMatchInlineSnapshot(`
          {
            "nested": {},
            "outer": 1,
          }
        `);
    });

    it("supports deeply nested namespaces", async () => {
        const storageService = await setup();
        const namespace = storageService.getNamespace("a").getNamespace("b").getNamespace("c");
        namespace.set("foo", "bar");
        expect(getStorageData()).toMatchInlineSnapshot(`
          {
            "a": {
              "b": {
                "c": {
                  "foo": "bar",
                },
              },
            },
          }
        `);
    });
});

async function setup(options?: { storageId?: string }) {
    const storageId = options && "storageId" in options ? options.storageId : DEFAULT_STORAGE_ID;
    const storageService = await createService(StorageServiceImpl, {
        properties: {
            storageId
        }
    });
    return storageService;
}

function getStorageData() {
    // Wait for internal timeouts (debounced save)
    vi.advanceTimersByTime(25);

    const entry = MOCKED_STORAGE.get(DEFAULT_STORAGE_ID);
    if (entry == null) {
        throw new Error("No data in local storage");
    }
    return JSON.parse(entry);
}
function mockLocalStorage() {
    const storage = window.localStorage;
    vi.spyOn(storage, "setItem").mockImplementation((key, value) => MOCKED_STORAGE.set(key, value));
    vi.spyOn(storage, "getItem").mockImplementation((key) => MOCKED_STORAGE.get(key) ?? null);
    vi.spyOn(storage, "clear").mockImplementation(() => MOCKED_STORAGE.clear());

    vi.spyOn(storage, "removeItem").mockImplementation(notImplemented);
    vi.spyOn(storage, "clear").mockImplementation(notImplemented);
    vi.spyOn(storage, "length", "get").mockImplementation(notImplemented);
}

function notImplemented(): never {
    throw new Error("not implemented");
}
