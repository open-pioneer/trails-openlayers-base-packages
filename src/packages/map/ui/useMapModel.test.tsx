// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, it, vi } from "vitest";
import { MapModel, MapRegistry } from "../api";
import { useMapModel, UseMapModelResult } from "./useMapModel";
import { DefaultMapProvider } from "./DefaultMapProvider";
import { renderHook, RenderHookResult, waitFor } from "@testing-library/react";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createManualPromise } from "@open-pioneer/core";
import { MapModelImpl } from "../model/MapModelImpl";

afterEach(() => {
    vi.restoreAllMocks();
});

it("returns the immediately configured map model if specified", async () => {
    const services = mockServices();
    const mapModel = mockMapModel();
    const hook = renderHook(() => useMapModel({ map: mapModel }), {
        wrapper: (props) => <PackageContextProvider services={services} {...props} />
    });
    const result = await waitForMapModel(hook);
    expect(result).toBe(mapModel);
});

it("resolves the map model from the registry if mapId is specified", async () => {
    const services = mockServices({ expectedMapId: "foo" });
    const hook = renderHook(() => useMapModel({ mapId: "foo" }), {
        wrapper: (props) => <PackageContextProvider services={services} {...props} />
    });
    const result = await waitForMapModel(hook);
    expect(result).toBeDefined();
});

it("resolves the map model from the registry if mapId is specified (old overload)", async () => {
    const services = mockServices({ expectedMapId: "foo" });
    const hook = renderHook(() => useMapModel("foo"), {
        wrapper: (props) => <PackageContextProvider services={services} {...props} />
    });
    const result = await waitForMapModel(hook);
    expect(result).toBeDefined();
});

it("supports default map model from context", async () => {
    const services = mockServices();
    const mapModel = mockMapModel();
    const hook = renderHook(() => useMapModel({}), {
        wrapper: (props) => (
            <PackageContextProvider services={services}>
                <DefaultMapProvider map={mapModel}>{props.children}</DefaultMapProvider>
            </PackageContextProvider>
        )
    });
    const result = await waitForMapModel(hook);
    expect(result).toBe(mapModel);
});

it("supports default map id from context", async () => {
    const services = mockServices({ expectedMapId: "foo" });
    const hook = renderHook(() => useMapModel({}), {
        wrapper: (props) => (
            <PackageContextProvider services={services}>
                <DefaultMapProvider mapId="foo">{props.children}</DefaultMapProvider>
            </PackageContextProvider>
        )
    });
    const result = await waitForMapModel(hook);
    expect(result).toBeDefined();
});

it("local configuration of map model takes precedence", async () => {
    const services = mockServices();
    const mapModel = mockMapModel();
    const otherMapModel = mockMapModel();
    const hook = renderHook(() => useMapModel({ map: mapModel }), {
        wrapper: (props) => (
            <PackageContextProvider services={services}>
                <DefaultMapProvider map={otherMapModel}>{props.children}</DefaultMapProvider>
            </PackageContextProvider>
        )
    });
    const result = await waitForMapModel(hook);
    expect(result).toBe(mapModel);
});

it("local configuration of map id takes precedence", async () => {
    const services = mockServices({ expectedMapId: "foo" });
    const otherMapModel = mockMapModel();
    const hook = renderHook(() => useMapModel({ mapId: "foo" }), {
        wrapper: (props) => (
            <PackageContextProvider services={services}>
                <DefaultMapProvider map={otherMapModel}>{props.children}</DefaultMapProvider>
            </PackageContextProvider>
        )
    });
    const result = await waitForMapModel(hook);
    expect(result).toBeDefined();
    expect(result).not.toBe(otherMapModel);
});

it("throws an error if neither local nor default configuration is available", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // react also logs this error
    expect(() => {
        const services = mockServices();
        renderHook(() => useMapModel({}), {
            wrapper: (props) => <PackageContextProvider services={services} {...props} />
        });
    }).toThrowErrorMatchingInlineSnapshot(
        `[Error: No map specified. You must either specify the map (or its id) via a DefaultMapProvider parent or configure it explicitly.]`
    );
});

it("throws an error if the map model is passed directly", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // react also logs this error

    const services = mockServices();
    const mapModel = mockMapModel();
    const otherMapModel = mockMapModel();
    expect(() => {
        renderHook(() => useMapModel(mapModel as any), {
            wrapper: (props) => (
                <PackageContextProvider services={services}>
                    <DefaultMapProvider map={otherMapModel}>{props.children}</DefaultMapProvider>
                </PackageContextProvider>
            )
        });
    }).toThrowErrorMatchingInlineSnapshot(
        `[Error: Map model instances cannot be passed directly to 'useMapModel' (see TypeScript signature).]`
    );
});

it("returns the async loading status of the map model", async () => {
    const mapModel = mockMapModel();
    const { promise, resolve } = createManualPromise<MapModel>();

    const services = mockServices({ expectedMapId: "foo", customPromise: promise });
    const hook = renderHook(() => useMapModel({ mapId: "foo" }), {
        wrapper: (props) => <PackageContextProvider services={services} {...props} />
    });

    expect(hook.result.current.kind).toBe("loading");
    expect(hook.result.current.map).toBeUndefined();
    expect(hook.result.current.error).toBeUndefined();

    resolve(mapModel);
    await waitFor(() => {
        if (hook.result.current.kind === "loading") {
            throw new Error("still loading");
        }
    });

    expect(hook.result.current.kind).toBe("resolved");
    expect(hook.result.current.map).toBe(mapModel);
    expect(hook.result.current.error).toBeUndefined();
});

it("returns the async loading error of the map model", async () => {
    const { promise, reject } = createManualPromise<MapModel>();

    const services = mockServices({ expectedMapId: "foo", customPromise: promise });
    const hook = renderHook(() => useMapModel({ mapId: "foo" }), {
        wrapper: (props) => <PackageContextProvider services={services} {...props} />
    });

    expect(hook.result.current.kind).toBe("loading");
    expect(hook.result.current.map).toBeUndefined();
    expect(hook.result.current.error).toBeUndefined();

    const err = new Error("some error");
    reject(err);
    await waitFor(() => {
        if (hook.result.current.kind === "loading") {
            throw new Error("still loading");
        }
    });

    expect(hook.result.current.kind).toBe("rejected");
    expect(hook.result.current.map).toBe(undefined);
    expect(hook.result.current.error).toBe(err);
});

async function waitForMapModel(
    hook: RenderHookResult<UseMapModelResult, unknown>
): Promise<MapModel> {
    return await waitFor(() => {
        const { map, error } = hook.result.current;
        if (error) {
            throw error;
        }
        if (!map) {
            throw new Error("map model did not resolve");
        }
        return map;
    });
}

interface MockModelOptions {
    expectedMapId?: string | undefined;
    customPromise?: Promise<MapModel> | undefined;
}

function mockServices(options?: MockModelOptions): PackageContextProviderProps["services"] {
    return {
        "map.MapRegistry": mockMapRegistry(options)
    };
}

function mockMapRegistry(options?: MockModelOptions): MapRegistry {
    const { expectedMapId, customPromise } = options ?? {};

    let model;
    return {
        async expectMapModel(mapId): Promise<MapModel> {
            if (expectedMapId != null && expectedMapId == mapId) {
                if (customPromise) {
                    return customPromise;
                }
                return (model ??= mockMapModel());
            }
            throw new Error("Called for unexpected map id: " + mapId);
        }
    } satisfies Partial<MapRegistry> as MapRegistry;
}

function mockMapModel(): MapModel {
    const map = Object.create(MapModelImpl.prototype);
    if (!(map instanceof MapModelImpl)) {
        throw new Error("not instanceof");
    }

    return Object.defineProperties(map, {
        id: { value: "1234" },
        container: { value: document.createElement("div") },
        layers: { value: {} },
        olMap: { value: {} }
    });
}
