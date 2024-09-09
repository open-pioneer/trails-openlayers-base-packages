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

export class HistoryViewModel {
    private olMap: OlMap;
    private handle: EventsKey | undefined;

    private mapViews: ReactiveMap<number, mapViewState> = reactiveMap<number, mapViewState>();
    private activeViewId: Reactive<number> = reactive(0);

    constructor(map: MapModel) {
        this.olMap = map.olMap;
        this.handle = this.#subscribeToMapEvents();
    }

    destroy() {
        this.handle && unByKey(this.handle);
    }

    get canBackward(): boolean {
        return this.mapViews.get(this.activeViewId.value - 1) != null;
    }

    get canForward(): boolean {
        // TODO
        throw new Error("not implemented");
    }

    backward() {}

    forward() {}

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

        const olMap = this.olMap;
        const mapViews = this.mapViews;
        const onCenterResChange = () => {
            const tempView = olMap.getView();
            if (tempView?.getResolution() !== undefined && tempView.getCenter() !== undefined) {
                if (
                    tempView.getCenter() !== mapViews.get(this.activeViewId.value)?.center ||
                    tempView.getResolution() !== mapViews.get(this.activeViewId.value)?.resolution
                ) {
                    const tempMapState = {
                        resolution: tempView.getResolution()!,
                        center: tempView.getCenter()!
                    };
                    for (const k of mapViews.keys()) {
                        if (k > this.activeViewId.value + 1) {
                            mapViews.delete(k);
                        }
                    }
                    mapViews.set(this.activeViewId.value + 1, tempMapState);
                    // TODO: setMapViews(tempMapViews);
                    // TODO: setActiveViewId(this.activeViewId + 1);
                }
            }
        };

        return eventsKey;
    }
}
