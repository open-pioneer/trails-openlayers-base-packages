// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Button, Tooltip } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";
import { FiHome } from "react-icons/fi";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { Extent } from "ol/extent";

export interface InitialExtentProps extends BoxProps, RefAttributes<HTMLDivElement> {
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
 * Provides a simple button that switches the view to its initial viewpoint.
 */
export const InitialExtent: FC<InitialExtentProps> = forwardRef(function InitialExtent(
    props: InitialExtentProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, ...rest } = props;
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    function setInitExtent() {
        const initialExtent = map?.initialExtent;
        const olMap = map?.olMap;

        if (initialExtent && olMap) {
            const olExtent: Extent = [
                initialExtent.xMin,
                initialExtent.yMin,
                initialExtent.xMax,
                initialExtent.yMax
            ];
            olMap.getView().fit(olExtent, { duration: 200 });
        }
    }

    return (
        <Box className={classNames("initial-extent", className)} ref={ref} {...rest}>
            <Tooltip
                label={intl.formatMessage({ id: "description" })}
                placement="auto"
                openDelay={500}
            >
                <Button
                    className="initial-extent-button"
                    aria-label={intl.formatMessage({ id: "description" })}
                    leftIcon={<FiHome />}
                    onClick={() => setInitExtent()}
                    iconSpacing={0}
                    padding={0}
                />
            </Tooltip>
        </Box>
    );
});
