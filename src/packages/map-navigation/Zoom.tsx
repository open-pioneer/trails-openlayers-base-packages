// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ButtonProps } from "@chakra-ui/react";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, RefAttributes, useState } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";

export type ZoomInProps = Omit<ZoomProps, "zoomDirection">;

/**
 * Provides a button by which the user can zoom into the map.
 *
 * This component composes {@link Zoom}.
 */
export const ZoomIn: FC<ZoomInProps> = function ZoomIn(props) {
    return <Zoom zoomDirection="in" {...props} />;
};

export type ZoomOutProps = ZoomInProps;

/**
 * Provides a button by which the user can zoom out of the map.
 *
 * This component composes {@link Zoom}.
 */
export const ZoomOut: FC<ZoomOutProps> = function ZoomOut(props) {
    return <Zoom zoomDirection="out" {...props} />;
};

export interface ZoomProps
    extends CommonComponentProps,
        RefAttributes<HTMLButtonElement>,
        MapModelProps {
    /**
     * Additional properties for the `Button` element.
     *
     * Note that the ToolButton also defines some of these props.
     */
    buttonProps?: Partial<ButtonProps>;

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
export const Zoom: FC<ZoomProps> = function Zoom(props: ZoomProps) {
    const { buttonProps, zoomDirection, ref } = props;
    const { map } = useMapModel(props);
    const intl = useIntl();
    const [disabled, setDisabled] = useState<boolean>(false);
    const { defaultClassName, buttonLabel, buttonIcon } = getDirectionProps(intl, zoomDirection);

    const { containerProps } = useCommonComponentProps(classNames("zoom", defaultClassName), props);

    function zoom() {
        if (disabled) {
            return;
        }
        setDisabled(true);
        const view = map?.olView;
        let currZoom = map?.zoomLevel;

        const maxZoom = view?.getMaxZoom() || Number.MAX_SAFE_INTEGER;
        const minZoom = view?.getMinZoom() || 0;
        if (view && currZoom !== undefined) {
            if (zoomDirection === "in" && currZoom < maxZoom) {
                ++currZoom;
            } else if (zoomDirection === "out" && currZoom > minZoom) {
                --currZoom;
            }

            view.animate({ zoom: currZoom, duration: 200 }, () => setDisabled(false));
        }
    }

    return (
        <ToolButton
            ref={ref}
            buttonProps={buttonProps}
            label={buttonLabel}
            icon={buttonIcon}
            onClick={zoom}
            {...containerProps}
        />
    );
};

function getDirectionProps(intl: PackageIntl, zoomDirection: "in" | "out") {
    switch (zoomDirection) {
        case "in":
            return {
                defaultClassName: "zoom-in",
                buttonLabel: intl.formatMessage({ id: "zoom-in.title" }),
                buttonIcon: <LuPlus />
            };
        case "out":
            return {
                defaultClassName: "zoom-out",
                buttonLabel: intl.formatMessage({ id: "zoom-out.title" }),
                buttonIcon: <LuMinus />
            };
    }
}
