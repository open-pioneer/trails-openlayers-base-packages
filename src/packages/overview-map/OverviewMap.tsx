// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, BoxProps } from "@chakra-ui/react";
import { isAbortError, createLogger } from "@open-pioneer/core";
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import {
    CommonComponentProps,
    mergeChakraProps,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { OverviewMap as OlOverviewMap } from "ol/control";
import OlBaseLayer from "ol/layer/Base";
import { useIntl } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { FC, useEffect, useMemo, useRef } from "react";

const LOG = createLogger(sourceId);

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

    const map = useMapModelValue(props);
    const overviewMapControlElem = useRef(null);

    useEffect(() => {
        if (overviewMapControlElem.current && olLayer) {
            const olMap = map.olMap;
            const element = overviewMapControlElem.current;

            let overviewMapControl: OlOverviewMap | undefined;
            let cancelled = false;
            map.whenDisplayed()
                .then(() => {
                    if (cancelled) return;
                    overviewMapControl = new OlOverviewMap({
                        className: "ol-overviewmap",
                        layers: [olLayer],
                        collapsible: false,
                        collapsed: false,
                        target: element
                    });
                    olMap.addControl(overviewMapControl);
                })
                .catch((error) => {
                    if (!isAbortError(error) && !cancelled) {
                        LOG.error("Error displaying overview map control:", error);
                    }
                });

            return () => {
                if (overviewMapControl) {
                    olMap.removeControl(overviewMapControl);
                    overviewMapControl.dispose();
                }
                cancelled = true;
            };
        }
    }, [map, olLayer]);

    const mergedBoxProps = useMemo(
        () =>
            mergeChakraProps<BoxProps>(
                {
                    height,
                    width,
                    role: "region",
                    "aria-label": intl.formatMessage({ id: "ariaLabel" }),
                    "aria-description": intl.formatMessage({ id: "ariaDescription" }),
                    tabIndex: 0
                },
                containerProps
            ),
        [height, width, intl, containerProps]
    );

    return <Box ref={overviewMapControlElem} {...mergedBoxProps} />;
};
