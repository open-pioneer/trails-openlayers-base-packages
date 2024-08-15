// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { NaviHistoryForward, NaviHistoryBackward } from "@open-pioneer/map-navigation";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { Coordinate } from "ol/coordinate";
import { useEffect, useRef, useState } from "react";
import { useMapModel } from "@open-pioneer/map";
import { View } from "ol";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

interface mapViewState {
    /** Map resolution */
    resolution: number;

    /** Map center */
    center: Coordinate;
}
export function MapViewNavigation() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);
    const [mapViews, setMapViews] = useState<Map<number, mapViewState>>(
        new Map<number, mapViewState>()
    );
    const [activeViewId, setActiveViewId] = useState<number>(-1);
    const useLocalContext = (data: { activeViewId: number }) => {
        const ctx = useRef(data);
        ctx.current = data;
        return ctx;
    };
    const ctx = useLocalContext({ activeViewId });
    useEffect(() => {
        if (!map) {
            return;
        }

        const eventsKey: EventsKey = map.olMap.on("moveend", () => {
            onCenterResChange();
        });

        return () => unByKey(eventsKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    function onCenterResChange() {
        const tempView = map?.olMap.getView();
        if (tempView?.getResolution() !== undefined && tempView.getCenter() !== undefined) {
            if (
                tempView.getCenter() !== mapViews.get(ctx.current.activeViewId)?.center ||
                tempView.getResolution() !== mapViews.get(ctx.current.activeViewId)?.resolution
            ) {
                const tempMapState = {
                    resolution: tempView.getResolution()!,
                    center: tempView.getCenter()!
                };
                const tempMapViews = mapViews;
                tempMapViews.forEach((v, k) => {
                    if (k > ctx.current.activeViewId + 1) {
                        tempMapViews.delete(k);
                    }
                });
                tempMapViews.set(ctx.current.activeViewId + 1, tempMapState);
                setMapViews(tempMapViews);
                setActiveViewId(ctx.current.activeViewId + 1);
            }
        }
    }

    useEffect(() => {
        const view = map?.olMap.getView();
        if (view !== undefined && mapViews.get(activeViewId) !== undefined) {
            map?.olMap.setView(
                new View({
                    center: mapViews.get(activeViewId)!.center,
                    resolution: mapViews.get(activeViewId)!.resolution,
                    projection: view.getProjection()
                })
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeViewId]);

    function viewChange(viewDirection: string) {
        if (viewDirection === "forward") {
            setActiveViewId(activeViewId + 1);
        } else {
            setActiveViewId(activeViewId - 1);
        }
    }

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="row"
            gap={1}
            padding={1}
        >
            <NaviHistoryBackward
                viewChange={() => viewChange("backward")}
                isDisabled={mapViews.get(activeViewId - 1) === undefined}
            />
            <NaviHistoryForward
                viewChange={() => viewChange("forward")}
                isDisabled={mapViews.get(activeViewId + 1) === undefined}
            />
        </Flex>
    );
}
