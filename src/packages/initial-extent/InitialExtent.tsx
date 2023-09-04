// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, IconButton } from "@open-pioneer/chakra-integration";
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
 * Provides a simple Button that switches the View to its initial Viewpoint
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
        //FRAGE: classname-erweiterung an box oder button? wrapper/box überhaupt benötigt?
        //FRAGE: erwarte ich bei einem tool, dass ich den button mit dem classname direkt adressiere?
        <Box className={classNames("initial-extent", className)} ref={ref} {...rest}>
            <IconButton
                className="initial-extent-button"
                size="sm"
                aria-label={intl.formatMessage({ id: "aria-label" })}
                colorScheme="teal"
                variant="solid"
                icon={<FiHome />}
                onClick={() => setInitExtent()}
            />
        </Box>
    );
});
