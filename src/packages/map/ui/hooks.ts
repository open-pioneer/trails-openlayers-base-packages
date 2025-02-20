// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import OlMap from "ol/Map";
import OlView from "ol/View";
import { unByKey } from "ol/Observable";
import { Projection, getPointResolution } from "ol/proj";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * From Web Map Server Implementation Specification -> 7.2.4.6.9 Scale denominators
 *
 * For the purposes of this International Standard, the common pixel size is defined to be 0,28 mm × 0,28 mm.
 * Because arbitrary clients can request maps from a server, the true pixel size of the final rendering device is
 * unknown to the server.
 */
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

/**
 * Returns the current view of the given map.
 *
 * @deprecated Use `mapModel.olView` instead.
 */
export function useView(map: OlMap | undefined): OlView | undefined {
    return useOlProperty(map, getView, watchView);
}

function getView(map: OlMap) {
    return map.getView();
}

function watchView(map: OlMap, cb: Callback) {
    return map.on("change:view", cb);
}

/**
 * Returns the current projection of the map.
 *
 * @deprecated Use `mapModel.projection` instead.
 */
export function useProjection(map: OlMap | undefined): Projection | undefined {
    const view = useView(map);
    return view?.getProjection();
}

/**
 * Returns the current resolution of the map.
 *
 * @deprecated Use `mapModel.resolution` instead.
 */
export function useResolution(map: OlMap | undefined): number | undefined {
    const view = useView(map);
    return useOlProperty(view, getResolution, watchResolution);
}

function getResolution(view: OlView): number | undefined {
    return view.getResolution();
}

function watchResolution(view: OlView, cb: Callback) {
    return view.on("change:resolution", cb);
}

/**
 * Returns the current center coordinates of the map.
 *
 * @deprecated Use `mapModel.center` instead.
 */
export function useCenter(map: OlMap | undefined): Coordinate | undefined {
    const view = useView(map);
    return useOlProperty(view, getCenter, watchCenter);
}

function getCenter(view: OlView): Coordinate | undefined {
    return view.getCenter();
}

function watchCenter(view: OlView, cb: Callback) {
    return view.on("change:center", cb);
}

/**
 * Returns the current scale of the map.
 *
 * @deprecated Use `mapModel.scale` instead.
 */
export function useScale(map: OlMap | undefined): number | undefined {
    const center = useCenter(map);
    const resolution = useResolution(map);
    const projection = useProjection(map);
    const scale = useMemo(() => {
        if (projection == null || resolution == null || center == null) {
            return undefined;
        }

        /**
         * Returns the appropriate scale for the given resolution and units, see OpenLayers function getScaleForResolution()
         * https://github.com/openlayers/openlayers/blob/7fa9df03431e9e1bc517e6c414565d9f848a3132/src/ol/control/ScaleLine.js#L454C3-L454C24
         */
        const pointResolution = getPointResolution(projection, resolution, center);
        const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
        return scale;
    }, [projection, resolution, center]);
    return scale;
}

type Callback = () => void;

/**
 * Returns the value of an observable ol property.
 *
 * Make sure to keep `accessor` and `watcher` stable to reduce re-subscriptions:
 * either use global functions or wrap the functions into `useCallback`.
 */
function useOlProperty<T, R>(
    object: T | undefined,
    accessor: (object: T) => R,
    watcher: (object: T, cb: Callback) => EventsKey
): R | undefined {
    const getSnapshot = useCallback(
        () => (object ? accessor(object) : undefined),
        [object, accessor]
    );
    const subscribe = useCallback(
        (cb: Callback) => {
            if (!object) {
                return () => undefined;
            }

            const key = watcher(object, cb);
            return () => unByKey(key);
        },
        [object, watcher]
    );
    return useSyncExternalStore(subscribe, getSnapshot);
}
