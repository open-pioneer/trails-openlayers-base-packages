// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { useAsync } from "react-use";
import { MapModel } from "../api";

/** Return value of {@link useMapModel}. */
export type UseMapModelResult =
    | {
          kind: "loading" | "resolved" | "rejected";
          map?: MapModel | undefined;
          error?: Error | undefined;
      }
    | UseMapModelLoading
    | UseMapModelResolved
    | UseMapModelRejected;

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
 * React hooks that looks up the map with the given id in the `map.MapRegistry` service.
 *
 * Returns an object representing the progress, which will eventually represent either
 * the map model value or an initialization error.
 *
 * The map model cannot be returned directly because it may not have completed its initialization yet.
 */
export function useMapModel(mapId: string): UseMapModelResult {
    const mapRegistry = useService("map.MapRegistry");
    const state = useAsync(() => mapRegistry.getMapModel(mapId), [mapRegistry, mapId]);
    const result = useMemo((): UseMapModelResult => {
        if (state.loading) {
            return { kind: "loading" };
        }
        if (state.error) {
            return { kind: "rejected", error: state.error };
        }
        return { kind: "resolved", map: state.value };
    }, [state]);
    return result;
}
