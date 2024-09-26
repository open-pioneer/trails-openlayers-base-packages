// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { View } from "ol";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import OlMap from "ol/Map";
import { Reactive, reactive, ReactiveMap, reactiveMap } from "@conterra/reactivity-core";
import { Coordinate } from "ol/coordinate";

interface mapViewState {
    /** Map resolution */
    resolution: number;

    /** Map center */
    center: Coordinate;
}

export class ViewHistoryModel {
    private olMap: OlMap;
    private handle: EventsKey | undefined;

    private _mapViews: ReactiveMap<number, mapViewState> = reactiveMap<number, mapViewState>();
    private _activeViewId: Reactive<number> = reactive(0);

    constructor(map: MapModel) {
        this.backward = this.backward.bind(this);
        this.forward = this.forward.bind(this);
        this.olMap = map.olMap;
        this.destroy();
        this.handle = this.#subscribeToMapEvents();
    }

    destroy() {
        this.handle && unByKey(this.handle);
    }

    get activeViewId(): number {
        return this._activeViewId.value;
    }

    set activeViewId(activeViewId) {
        this._activeViewId.value = activeViewId;
    }

    get mapViews(): ReactiveMap<number, mapViewState> {
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
        this.activeViewId -= 1;
        this.#goto(this.activeViewId);
    }

    forward() {
        this.activeViewId += 1;
        this.#goto(this.activeViewId);
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
        this.destroy();
        const eventsKey: EventsKey = this.olMap.on("moveend", async () => {
            onCenterResChange();
        });

        const onCenterResChange = () => {
            const olMap = this.olMap;
            const mapViews = this.mapViews;
            const tempView = olMap.getView();
            if (tempView.getResolution() !== undefined && tempView.getCenter() !== undefined) {
                if (
                    tempView.getCenter() !== mapViews.get(this.activeViewId)?.center ||
                    tempView.getResolution() !== mapViews.get(this.activeViewId)?.resolution
                ) {
                    const tempMapState = {
                        resolution: tempView.getResolution()!,
                        center: tempView.getCenter()!
                    };
                    for (const k of mapViews.keys()) {
                        if (k > this.activeViewId + 1) {
                            mapViews.delete(k);
                        }
                    }
                    this.activeViewId += 1;
                    mapViews.set(this.activeViewId, tempMapState);
                    this.mapViews = mapViews;
                }
            }
        };

        return eventsKey;
    }
}
