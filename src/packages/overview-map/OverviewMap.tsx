// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps } from "@chakra-ui/react";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { OverviewMap as OlOverviewMap } from "ol/control";
import OlBaseLayer from "ol/layer/Base";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useRef } from "react";

/**
 * These are properties supported by the {@link OverviewMap}.
 */
export interface OverviewMapProps extends CommonComponentProps, MapModelProps {
    /**
     * The layer shown in the overview map.
     */
    olLayer: OlBaseLayer;

    /**
     * The height of the map.
     * This defaults to a reasonable pixel size.
     */
    height?: BoxProps["height"];

    /**
     * The width of the map.
     * This defaults to a reasonable pixel size.
     */
    width?: BoxProps["width"];
}

const DEFAULT_HEIGHT = "200px";
const DEFAULT_WIDTH = "300px";

/**
 * The `OverviewMap` component can be used in an app to have a better overview of the current location in the map.
 */
export const OverviewMap: FC<OverviewMapProps> = (props) => {
    const { olLayer, height = DEFAULT_HEIGHT, width = DEFAULT_WIDTH } = props;
    const { containerProps } = useCommonComponentProps("overview-map", props);
    const intl = useIntl();

    const { map } = useMapModel(props);
    const overviewMapControlElem = useRef(null);

    useEffect(() => {
        if (overviewMapControlElem.current && map && olLayer) {
            const olMap = map.olMap;
            const overviewMapControl: OlOverviewMap = new OlOverviewMap({
                className: "ol-overviewmap",
                layers: [olLayer],
                collapsible: false,
                collapsed: false,
                target: overviewMapControlElem.current
            });
            olMap.addControl(overviewMapControl);
            return () => {
                olMap.removeControl(overviewMapControl);
            };
        }
    }, [map, olLayer]);

    return (
        // aria-description is still in draft state
        // eslint-disable-next-line jsx-a11y/role-supports-aria-props
        <Box
            height={height}
            width={width}
            ref={overviewMapControlElem}
            {...containerProps}
            tabIndex={0}
            role="region"
            aria-label={intl.formatMessage({ id: "ariaLabel" })}
            aria-description={intl.formatMessage({ id: "ariaDescription" })}
        />
    );
};
