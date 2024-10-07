// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { View } from "ol";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import OlMap from "ol/Map";
import { Reactive, reactive, ReactiveMap, reactiveMap } from "@conterra/reactivity-core";
import { Coordinate } from "ol/coordinate";

interface MapViewState {
    /** Map resolution */
    resolution: number;

    /** Map center */
    center: Coordinate;
}

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
        this.olMap.setView(
            new View({
                center: this.mapViews.get(activeViewId)!.center,
                resolution: this.mapViews.get(activeViewId)!.resolution,
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
                    for (const k of mapViews.keys()) {
                        if (k > nextViewId) {
                            mapViews.delete(k);
                        }
                    }
                    this.#setActiveView(nextViewId);
                    mapViews.set(nextViewId, mapState);
                }
            }
        };

        return eventsKey;
    }
}
