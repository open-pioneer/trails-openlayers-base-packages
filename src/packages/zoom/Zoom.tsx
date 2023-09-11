// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, IconButton, Flex, Tooltip } from "@open-pioneer/chakra-integration";
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
 * Provides a simple Button that switches the View to its initial Viewpoint
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
        const currZoom = view?.getZoom();
        if (view && currZoom !== undefined) {
            view.animate({ zoom: currZoom + (zoomIn ? 1 : -1), duration: 200 });
        }
    }

    return (
        <Box className={classNames("zoom", className)} ref={ref} {...rest}>
            <Flex direction={"column"} gap="1">
                <Tooltip
                    label={intl.formatMessage({ id: "description_in" })}
                    placement="auto"
                    openDelay={500}
                >
                    <IconButton
                        className="zoomin-button"
                        aria-label={intl.formatMessage({ id: "description_in" })}
                        icon={<FiPlus />}
                        onClick={() => zoom(true)}
                    />
                </Tooltip>
                <Tooltip
                    label={intl.formatMessage({ id: "description_out" })}
                    placement="auto"
                    openDelay={500}
                >
                    <IconButton
                        className="zoomout-button"
                        aria-label={intl.formatMessage({ id: "description_out" })}
                        icon={<FiMinus />}
                        onClick={() => zoom(false)}
                    />
                </Tooltip>
            </Flex>
        </Box>
    );
});
