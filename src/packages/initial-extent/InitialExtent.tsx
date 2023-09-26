// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Tooltip } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import { Extent } from "ol/extent";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, forwardRef } from "react";
import { FiHome } from "react-icons/fi";

export interface InitialExtentProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;
}

/**
 * Provides a simple button that switches the view to its initial viewpoint.
 */
export const InitialExtent: FC<InitialExtentProps> = forwardRef(function InitialExtent(
    props: InitialExtentProps,
    ref: ForwardedRef<HTMLDivElement>
) {
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("initial-extent", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    function setInitExtent() {
        const initialExtent = map?.initialExtent;
        const olMap = map?.olMap;

        if (initialExtent && olMap) {
            const newExtent: Extent = [
                initialExtent.xMin,
                initialExtent.yMin,
                initialExtent.xMax,
                initialExtent.yMax
            ];

            olMap.getView().fit(newExtent, { duration: 200 });
        }
    }

    return (
        <Box ref={ref} {...containerProps}>
            <Tooltip label={intl.formatMessage({ id: "title" })} placement="auto" openDelay={500}>
                <Button
                    className="initial-extent-button"
                    aria-label={intl.formatMessage({ id: "title" })}
                    leftIcon={<FiHome />}
                    onClick={setInitExtent}
                    iconSpacing={0}
                    padding={0}
                />
            </Tooltip>
        </Box>
    );
});
