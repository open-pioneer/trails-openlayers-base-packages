// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Tooltip } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

export type ZoomInProps = Omit<ZoomProps, "zoomDirection">;

/**
 * Provides a button by which the user can zoom into the map.
 *
 * This component composes {@link Zoom}.
 */
export const ZoomIn: FC<ZoomInProps> = forwardRef(function ZoomIn(props, ref) {
    return <Zoom zoomDirection="in" ref={ref} {...props} />;
});

export type ZoomOutProps = ZoomInProps;

/**
 * Provides a button by which the user can zoom out of the map.
 *
 * This component composes {@link Zoom}.
 */
export const ZoomOut: FC<ZoomOutProps> = forwardRef(function ZoomOut(props, ref) {
    return <Zoom zoomDirection="out" ref={ref} {...props} />;
});

export interface ZoomProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The map id.
     */
    mapId: string;

    /**
     * The zoom direction.
     *
     * The button will either zoom in or zoom out depending on this value.
     */
    zoomDirection: "in" | "out";
}

/**
 * Provides a button by which the user can zoom in or zoom out of the map.
 */
export const Zoom: FC<ZoomProps> = forwardRef(function Zoom(
    props: ZoomProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const { mapId, zoomDirection } = props;
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const { defaultClassName, buttonLabel, buttonIcon } = getDirectionProps(intl, zoomDirection);

    const { containerProps } = useCommonComponentProps(classNames("zoom", defaultClassName), props);

    function zoom() {
        const view = map?.olMap.getView();
        let currZoom = view?.getZoom();

        if (view && currZoom !== undefined) {
            if (zoomDirection === "in") {
                ++currZoom;
            } else {
                --currZoom;
            }

            view.animate({ zoom: currZoom, duration: 200 });
        }
    }

    return (
        <Tooltip label={buttonLabel} placement="auto" openDelay={500}>
            <Button
                ref={ref}
                aria-label={buttonLabel}
                leftIcon={buttonIcon}
                onClick={zoom}
                iconSpacing={0}
                padding={0}
                {...containerProps}
            />
        </Tooltip>
    );
});

function getDirectionProps(intl: PackageIntl, zoomDirection: "in" | "out") {
    switch (zoomDirection) {
        case "in":
            return {
                defaultClassName: "zoom-in",
                buttonLabel: intl.formatMessage({ id: "zoom-in.title" }),
                buttonIcon: <FiPlus />
            };
        case "out":
            return {
                defaultClassName: "zoom-out",
                buttonLabel: intl.formatMessage({ id: "zoom-out.title" }),
                buttonIcon: <FiMinus />
            };
    }
}
