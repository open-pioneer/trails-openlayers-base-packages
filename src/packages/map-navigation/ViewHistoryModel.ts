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
        this.backward = this.backward.bind(this);
        this.forward = this.forward.bind(this);
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

    set activeViewId(activeViewId) {
        this._activeViewId.value = activeViewId;
    }

    get mapViews(): ReactiveMap<number, MapViewState> {
        return this._mapViews;
    }

    set mapViews(mapViews) {
        this._mapViews = mapViews;
    }

    get canBackward(): boolean {
        return this.mapViews.get(this.activeViewId - 1) != null;
    }

    get canForward(): boolean {
        return this.mapViews.get(this.activeViewId + 1) != null;
    }

    backward() {
        if (this.canBackward) {
            this.activeViewId -= 1;
            this.#goto(this.activeViewId);
        } else throw new Error("Backward is not possible at the moment");
    }

    forward() {
        if (this.canForward) {
            this.activeViewId += 1;
            this.#goto(this.activeViewId);
        } else throw new Error("Vorward is not possible at the moment");
    }

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

    #subscribeToMapEvents() {
        const eventsKey: EventsKey = this.olMap.on("moveend", () => {
            onCenterResChange();
        });

        const onCenterResChange = () => {
            const olMap = this.olMap;
            const mapViews = this.mapViews;
            const tempView = olMap.getView();
            const tempRes = tempView.getResolution();
            const tempCenter = tempView.getCenter();
            if (tempRes !== undefined && tempCenter !== undefined) {
                if (
                    tempCenter !== mapViews.get(this.activeViewId)?.center ||
                    tempRes !== mapViews.get(this.activeViewId)?.resolution
                ) {
                    const tempMapState = {
                        resolution: tempRes!,
                        center: tempCenter!
                    };
                    for (const k of mapViews.keys()) {
                        if (k > this.activeViewId + 1) {
                            mapViews.delete(k);
                        }
                    }
                    this.activeViewId += 1;
                    mapViews.set(this.activeViewId, tempMapState);
                }
            }
        };

        return eventsKey;
    }
}
