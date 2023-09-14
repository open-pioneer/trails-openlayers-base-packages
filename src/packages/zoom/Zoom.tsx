// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Button, Flex, Tooltip } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";
import { FiPlus, FiMinus } from "react-icons/fi";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";

export interface ZoomProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The map id.
     */
    mapId: string;

    /**
     * Additional class name(s).
     */
    className?: string;
}

/**
 * Provides two buttons by which the user can zoom in and zoom out of the map.
 */
export const Zoom: FC<ZoomProps> = forwardRef(function Zoom(
    props: ZoomProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, ...rest } = props;
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    function zoom(zoomIn: boolean) {
        const view = map?.olMap.getView();
        let currZoom = view?.getZoom();

        if (view && currZoom !== undefined) {
            if (zoomIn) {
                ++currZoom;
            } else {
                --currZoom;
            }

            view.animate({ zoom: currZoom, duration: 200 });
        }
    }

    return (
        <Box className={classNames("zoom", className)} ref={ref} {...rest}>
            <Flex direction={"column"} gap="1">
                <Tooltip
                    label={intl.formatMessage({ id: "zoom-in.title" })}
                    placement="auto"
                    openDelay={500}
                >
                    <Button
                        className="btn-zoom-in"
                        aria-label={intl.formatMessage({ id: "zoom-in.title" })}
                        leftIcon={<FiPlus />}
                        onClick={() => zoom(true)}
                        iconSpacing={0}
                        padding={0}
                    />
                </Tooltip>
                <Tooltip
                    label={intl.formatMessage({ id: "zoom-out.title" })}
                    placement="auto"
                    openDelay={500}
                >
                    <Button
                        className="btn-zoom-out"
                        aria-label={intl.formatMessage({ id: "zoom-out.title" })}
                        leftIcon={<FiMinus />}
                        onClick={() => zoom(false)}
                        iconSpacing={0}
                        padding={0}
                    />
                </Tooltip>
            </Flex>
        </Box>
    );
});
