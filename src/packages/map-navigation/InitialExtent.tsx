// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Tooltip } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { Extent } from "ol/extent";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { FiHome } from "react-icons/fi";

export interface InitialExtentProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
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
    ref: ForwardedRef<HTMLButtonElement>
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
        <Tooltip
            label={intl.formatMessage({ id: "initial-extent.title" })}
            placement="auto"
            openDelay={500}
        >
            <Button
                className="initial-extent-button"
                ref={ref}
                aria-label={intl.formatMessage({ id: "initial-extent.title" })}
                leftIcon={<FiHome />}
                onClick={setInitExtent}
                iconSpacing={0}
                padding={0}
                {...containerProps}
            />
        </Tooltip>
    );
});
