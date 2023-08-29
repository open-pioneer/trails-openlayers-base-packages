// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useMapModel } from "@open-pioneer/map";
import { ScaleLine } from "ol/control";
import { HTMLAttributes, useEffect, useRef } from "react";

export function ScaleComponent(props: { mapId: string } & HTMLAttributes<HTMLDivElement>) {
    const { mapId, ...rest } = props;
    const scaleElem = useRef(null);
    const { map } = useMapModel(mapId);

    useEffect(() => {
        if (scaleElem.current && map) {
            const olMap = map.olMap;
            const scaleControl = new ScaleLine({
                units: "metric",
                target: scaleElem.current
            });
            olMap.addControl(scaleControl);
            return () => {
                olMap.removeControl(scaleControl);
            };
        }
    }, [map]);

    return <div className="scale-wrapper" ref={scaleElem} {...rest}></div>;
}
