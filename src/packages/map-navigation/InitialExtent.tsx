// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { Extent } from "ol/extent";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { FiHome } from "react-icons/fi";

export interface InitialExtentProps
    extends CommonComponentProps,
        RefAttributes<HTMLButtonElement>,
        MapModelProps {}

/**
 * Provides a simple button that switches the view to its initial viewpoint.
 */
export const InitialExtent: FC<InitialExtentProps> = forwardRef(function InitialExtent(
    props: InitialExtentProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const { containerProps } = useCommonComponentProps("initial-extent", props);
    const { map } = useMapModel(props);
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
        <ToolButton
            ref={ref}
            label={intl.formatMessage({ id: "initial-extent.title" })}
            icon={<FiHome />}
            onClick={setInitExtent}
            {...containerProps}
        />
    );
});
