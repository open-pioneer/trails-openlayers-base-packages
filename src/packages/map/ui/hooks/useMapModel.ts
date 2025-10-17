// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { useAsync } from "react-use";
import { MapRegistry } from "../../MapRegistry";
import { MapModel } from "../../model/MapModel";
import { useDefaultMap } from "../DefaultMapProvider";

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
 * React hook that returns the default map model (if available, see {@link DefaultMapProvider}).
 *
 * @deprecated Use {@link useMapModelValue} instead.
 */
export function useMapModel(): UseMapModelResult;

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
 * React hook that resolves a map model specified by the given `props`.
 *
 * Returns an object representing the progress, which will eventually represent either
 * the map model value or an initialization error.
 *
 * The map model cannot be returned directly because it may not have completed its initialization yet.
 */
export function useMapModel(props: { mapId: string }): UseMapModelResult;

export function useMapModel(props?: undefined | string | { mapId: string }): UseMapModelResult {
    if (props instanceof MapModel) {
        // This cannot happen in valid typescript code, but it might be a common mistake.
        throw new Error(
            `Map model instances cannot be passed directly to 'useMapModel' (see TypeScript signature).`
        );
    }

    const defaultMap = useDefaultMap();
    const mapRegistry = useService<MapRegistry>("map.MapRegistry");

    let mapId: string | undefined;
    if (typeof props === "string") {
        mapId = props;
    } else if (typeof props === "object") {
        mapId = props.mapId;
    }

    if (mapId == null && !defaultMap) {
        throw new Error(
            "No map specified. Either configure a mapId or use the DefaultMapProvider."
        );
    }

    const state = useAsync(async () => {
        if (mapId == null) {
            // For backwards compatibility
            return defaultMap!;
        }

        return await mapRegistry.expectMapModel(mapId);
    }, [mapRegistry, mapId]);

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
 * Options that specify which map to use. See {@link useMapModelValue}.
 *
 * When not setting any of these properties on a component, the default map (from the `DefaultMapProvider`) will be used.
 * If that is not available either, an error will be thrown.
 *
 * @see {@link DefaultMapProvider}
 */
export interface MapModelProps {
    /**
     * The map model to use.
     */
    map?: MapModel | undefined;
}

/**
 * Returns the configured map model.
 *
 * The map model is either directly configured or specified via a {@link DefaultMapProvider}.
 * If neither has been specified, an error will be thrown.
 *
 * This hook is preferable to {@link useMapModel} because it can return the map model directly, without waiting.
 */
export function useMapModelValue(props?: MapModelProps): MapModel {
    if (props instanceof MapModel) {
        // This cannot happen in valid typescript code, but it might be a common mistake.
        throw new Error(
            `Map model instances cannot be passed directly to 'useMapModelValue' (see TypeScript signature).`
        );
    }

    const localMap = props?.map;
    const defaultMap = useDefaultMap();
    const map = localMap ?? defaultMap;
    if (!map) {
        throw new Error(
            `No map specified. ` +
                `You must either specify the map via a DefaultMapProvider parent or configure it explicitly.`
        );
    }
    return map;
}
