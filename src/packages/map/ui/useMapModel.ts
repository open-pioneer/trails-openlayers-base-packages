// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { useAsync } from "react-use";
import { MapModel, MapRegistry } from "../api";
import { MapModelImpl } from "../model/MapModelImpl";
// eslint-disable-next-line unused-imports/no-unused-imports
import { DefaultMapProvider, useDefaultMapProps } from "./DefaultMapProvider";

/** Return value of {@link useMapModel}. */
export type UseMapModelResult = UseMapModelLoading | UseMapModelResolved | UseMapModelRejected;

export interface UseMapModelLoading {
    kind: "loading";
    map?: undefined;
    error?: undefined;
}

export interface UseMapModelResolved {
    kind: "resolved";
    map: MapModel;
    error?: undefined;
}

export interface UseMapModelRejected {
    kind: "rejected";
    map?: undefined;
    error: Error;
}

/**
 * Options that specify which map to use. See {@link useMapModel}.
 *
 * When not setting any of these properties on a component, the default map (from the `DefaultMapProvider`) will be used.
 * If that is not available either, an error will be thrown.
 */
export interface MapModelProps {
    /**
     * The id of the map.
     * The map will be looked up in the MapRegistry service.
     *
     * @deprecated Use the `map` property instead.
     *
     * @see {@link DefaultMapProvider}
     */
    mapId?: string | undefined;

    /**
     * The map model to use.
     */
    map?: MapModel | undefined;
}

/**
 * React hook that looks up the map with the given id in the `map.MapRegistry` service.
 *
 * Returns an object representing the progress, which will eventually represent either
 * the map model value or an initialization error.
 *
 * The map model cannot be returned directly because it may not have completed its initialization yet.
 */
export function useMapModel(mapId: string): UseMapModelResult;

/**
 * React hook that resolves a map model specified by the given `props` (see {@link MapModelProps}).
 *
 * Returns an object representing the progress, which will eventually represent either
 * the map model value or an initialization error.
 *
 * The map model cannot be returned directly because it may not have completed its initialization yet.
 */
export function useMapModel(props: MapModelProps): UseMapModelResult;

/**
 * React hook that returns the default map model (if available, see {@link DefaultMapProvider}).
 */
export function useMapModel(): UseMapModelResult;
export function useMapModel(props?: undefined | string | MapModelProps): UseMapModelResult {
    const resolvedMapArg = useResolvedMapArg(props);
    const mapRegistry = useService<MapRegistry>("map.MapRegistry");
    const state = useAsync(async () => {
        if (typeof resolvedMapArg === "string") {
            return await mapRegistry.expectMapModel(resolvedMapArg);
        }
        return Promise.resolve(resolvedMapArg);
    }, [mapRegistry, resolvedMapArg]);
    const result = useMemo((): UseMapModelResult => {
        if (state.loading) {
            return { kind: "loading" };
        }
        if (state.error) {
            return { kind: "rejected", error: state.error };
        }
        return { kind: "resolved", map: state.value! };
    }, [state]);
    return result;
}

/**
 * Resolves the map model (or its id) from the given props and the default map props.
 */
function useResolvedMapArg(props?: undefined | string | MapModelProps): MapModel | string {
    if (typeof props === "object" && props.mapId != null && props.map != null) {
        throw new Error(`Cannot specify both 'mapId' and 'map' in useMapModel at the same time.`);
    }
    if (props instanceof MapModelImpl) {
        // This cannot happen in valid typescript code, but it might be a common mistake.
        throw new Error(
            `Map model instances cannot be passed directly to 'useMapModel' (see TypeScript signature).`
        );
    }
    const localProps = useMemo((): MapModelProps => {
        // Normalize local props for compatibility with old string overload.
        if (props == null) {
            return {};
        }
        if (typeof props === "string") {
            return { mapId: props };
        }
        return { mapId: props.mapId, map: props.map };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...(typeof props === "string" || props == null ? [props] : [props.mapId, props.map])]);
    const defaultProps = useDefaultMapProps();

    const resolvedMapArg = resolveMap(localProps) ?? resolveMap(defaultProps);
    if (resolvedMapArg == null) {
        throw new Error(
            `No map specified. ` +
                `You must either specify the map (or its id) via a DefaultMapProvider parent or configure it explicitly.`
        );
    }
    return resolvedMapArg;
}

function resolveMap(props?: MapModelProps): MapModel | string | undefined {
    return props?.map ?? props?.mapId;
}
