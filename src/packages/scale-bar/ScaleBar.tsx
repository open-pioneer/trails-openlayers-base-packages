// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useRef } from "react";
import { ScaleLine } from "ol/control";
import { Box } from "@open-pioneer/chakra-integration";

/**
 * These are the properties supported by the {@link ScaleBar}.
 */
export interface ScaleBarProps extends CommonComponentProps, MapModelProps {
    /**
     * Display the scale either as a line or a bar. Defaults to `"line"`.
     */
    displayMode?: "bar" | "line";
}

export const ScaleBar: FC<ScaleBarProps> = (props) => {
    const { displayMode = "line" } = props;
    const { containerProps } = useCommonComponentProps("scale-bar", props);
    const { map } = useMapModel(props);
    const scaleBarElem = useRef(null);

    useEffect(() => {
        if (scaleBarElem.current && map) {
            const olMap = map.olMap;
            const scaleLine = new ScaleLine({
                units: "metric",
                target: scaleBarElem.current,
                bar: displayMode === "bar"
            });
            olMap.addControl(scaleLine);
            return () => {
                olMap.removeControl(scaleLine);
            };
        }
    }, [displayMode, map]);

    return <Box {...containerProps} ref={scaleBarElem}></Box>;
};
