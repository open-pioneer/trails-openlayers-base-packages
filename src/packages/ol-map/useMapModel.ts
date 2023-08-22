// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { useAsync } from "react-use";
import { MapModel } from "./api";

/** Return value of {@link useMapModel}. */
export type UseMapModelResult =
    | { loading: boolean; map?: MapModel | undefined; error?: Error | undefined }
    | UseMapModelLoading
    | UseMapModelReady
    | UseMapModelError;

export interface UseMapModelLoading {
    loading: true;
    map?: undefined;
    error?: undefined;
}

export interface UseMapModelReady {
    loading: false;
    map: MapModel;
    error?: undefined;
}

export interface UseMapModelError {
    loading: false;
    map?: undefined;
    error: Error;
}

/**
 * React hooks that looks up the map with the given id in the `ol-map.MapRegistry` service.
 *
 * Returns an object representing the progress, which will eventually represent either
 * the map model value or an initialization error.
 *
 * The map model cannot be returned directly because it may not have completed its initialization yet.
 */

export function useMapModel(mapId: string): UseMapModelResult {
    const mapRegistry = useService("ol-map.MapRegistry");
    const state = useAsync(() => mapRegistry.getMapModel(mapId), [mapRegistry, mapId]);
    const result = useMemo(() => {
        if (state.loading) {
            return { loading: true };
        }
        if (state.value) {
            return { loading: false, map: state.value };
        }
        if (state.error) {
            return { loading: false, error: state.error };
        }
        throw new Error(`Unexpected state (expected either loading, value or error).`);
    }, [state]);
    return result;
}
