// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { View } from "ol";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import OlMap from "ol/Map";
import { Reactive, reactive, ReactiveMap, reactiveMap } from "@conterra/reactivity-core";
import { Coordinate } from "ol/coordinate";
import { useEffect, useState } from "react";

interface MapViewState {
    /** Map resolution */
    resolution: number;

    /** Map center */
    center: Coordinate;
}

const SIZE_LIMIT = 200;

export class ViewHistoryModel {
    private olMap: OlMap;
    private handle: EventsKey | undefined;

    private _mapViews: ReactiveMap<number, MapViewState> = reactiveMap<number, MapViewState>();
    private _activeViewId: Reactive<number> = reactive(0);

    constructor(map: MapModel) {
        this.olMap = map.olMap;
        this.handle = this.#subscribeToMapEvents();
    }

    destroy() {
        this.handle && unByKey(this.handle);
        this.handle = undefined;
    }

    get activeViewId(): number {
        return this._activeViewId.value;
    }

    get mapViews(): ReactiveMap<number, MapViewState> {
        return this._mapViews;
    }

    get canBackward(): boolean {
        return this.mapViews.get(this.activeViewId - 1) != null;
    }

    get canForward(): boolean {
        return this.mapViews.get(this.activeViewId + 1) != null;
    }

    backward = () => {
        if (this.canBackward) {
            this.#setActiveView(this.activeViewId - 1);
            this.#goto(this.activeViewId);
        } else throw new Error("Backward is not possible at the moment");
    };

    forward = () => {
        if (this.canForward) {
            this.#setActiveView(this.activeViewId + 1);
            this.#goto(this.activeViewId);
        } else throw new Error("Forward is not possible at the moment");
    };

    #goto(activeViewId: number) {
        const view = this.olMap.getView();
        const activeView = this.mapViews.get(activeViewId);
        if (activeView == null) {
            throw new Error(`No view found for id ${activeViewId}`);
        }
        this.olMap.setView(
            new View({
                center: activeView.center,
                resolution: activeView.resolution,
                projection: view.getProjection()
            })
        );
    }

    #setActiveView(activeViewId: number) {
        this._activeViewId.value = activeViewId;
    }

    #subscribeToMapEvents() {
        const eventsKey: EventsKey = this.olMap.on("moveend", () => {
            onCenterResChange();
        });

        const onCenterResChange = () => {
            const olMap = this.olMap;
            const mapViews = this.mapViews;
            const view = olMap.getView();
            const resolution = view.getResolution();
            const center = view.getCenter();
            if (resolution != null && center != null) {
                if (
                    center !== mapViews.get(this.activeViewId)?.center ||
                    resolution !== mapViews.get(this.activeViewId)?.resolution
                ) {
                    const mapState = {
                        resolution: resolution,
                        center: center
                    };
                    const nextViewId = this.activeViewId + 1;

                    // Remove keys in the "future". Note: an array would probably be more efficient.
                    for (const k of mapViews.keys()) {
                        if (k > nextViewId) {
                            mapViews.delete(k);
                        }
                    }

                    // Remove old keys above limit (maps are sorted by insertion order, so this removes the oldest entries)
                    for (const k of mapViews.keys()) {
                        if (mapViews.size < SIZE_LIMIT) {
                            break;
                        }
                        mapViews.delete(k);
                    }

                    this.#setActiveView(nextViewId);
                    mapViews.set(nextViewId, mapState);
                }
            }
        };

        return eventsKey;
    }
}

interface ViewModelState {
    vm: ViewHistoryModel;
    useCount: number; // 0 -> must destroy
}

const VIEW_MODELS = new WeakMap<MapModel, ViewModelState>();

/**
 * An internal hook that returns a shared HistoryViewModel.
 * History tools that are active at the same time share a single model.
 *
 * The model is destroyed when the last tool is unmounted.
 *
 * TODO: `undefined` only because the map can be undefined at the moment (loading).
 *
 * NOTE: May be useful to have this a general solution in the future; but this is the only usage right now.
 */
export function useHistoryViewModel(map: MapModel): ViewHistoryModel | undefined {
    const [vm, setVm] = useState<ViewHistoryModel>();
    useEffect(() => {
        let state = VIEW_MODELS.get(map);
        if (state == null) {
            state = {
                vm: new ViewHistoryModel(map),
                useCount: 1
            };
            VIEW_MODELS.set(map, state);
        } else {
            state.useCount++;
        }
        setVm(state.vm);

        return () => {
            setVm(undefined);

            state.useCount--;
            if (state.useCount === 0) {
                state.vm.destroy();
                VIEW_MODELS.delete(map);
            }
        };
    }, [map]);
    return vm;
}
