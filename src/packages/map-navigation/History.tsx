// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ButtonProps } from "@chakra-ui/react";
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, RefAttributes } from "react";
import { LuCornerUpLeft, LuCornerUpRight } from "react-icons/lu";
import { useHistoryViewModel } from "./ViewHistoryModel";

export type HistoryForwardProps = Omit<HistoryProps, "viewDirection">;

/**
 * Provides a button by which the user can navigate to the next map view.
 *
 * This component composes {@link History}.
 */
export const HistoryForward: FC<HistoryForwardProps> = function HistoryForward(
    props: HistoryForwardProps
) {
    return <History viewDirection="forward" {...props} />;
};

export type HistoryBackwardProps = HistoryForwardProps;

/**
 * Provides a button by which the user can navigate to the previous map view.
 *
 * This component composes {@link History}.
 */
export const HistoryBackward: FC<HistoryBackwardProps> = function HistoryBackward(
    props: HistoryBackwardProps
) {
    return <History viewDirection="backward" {...props} />;
};

export interface HistoryProps
    extends CommonComponentProps, RefAttributes<HTMLButtonElement>, MapModelProps {
    /**
     * Additional properties for the `Button` element.
     *
     * Note that the ToolButton also defines some of these props.
     */
    buttonProps?: Partial<ButtonProps>;

    /**
     * The view direction.
     *
     * The button will either view forward or view backward depending on this value.
     */
    viewDirection: "forward" | "backward";
}

/**
 * Provides a button by which the user can navigate forward or backward in the view history of the map.
 */
export const History: FC<HistoryProps> = function History(props: HistoryProps) {
    const intl = useIntl();
    const { buttonProps, viewDirection, ref } = props;
    const map = useMapModelValue(props);
    const viewModel = useHistoryViewModel(map);
    const { defaultClassName, buttonLabel, buttonIcon } = getDirectionProps(intl, viewDirection);
    const { containerProps } = useCommonComponentProps(classNames("view", defaultClassName), props);

    const canNavigate = useReactiveSnapshot(() => {
        if (!viewModel) {
            return false;
        }

        if (viewDirection === "forward") {
            return viewModel.canForward;
        } else {
            return viewModel.canBackward;
        }
    }, [viewModel, viewDirection]);
    const navigate = () => {
        if (!viewModel) {
            return;
        }

        if (viewDirection === "forward") {
            viewModel.forward();
        } else {
            viewModel.backward();
        }
    };

    return (
        viewModel && (
            <ToolButton
                ref={ref}
                {...containerProps}
                buttonProps={buttonProps}
                label={buttonLabel}
                icon={buttonIcon}
                onClick={navigate}
                disabled={!canNavigate}
            />
        )
    );
};

function getDirectionProps(intl: PackageIntl, viewDirection: "forward" | "backward") {
    switch (viewDirection) {
        case "forward":
            return {
                defaultClassName: "view-forward",
                buttonLabel: intl.formatMessage({ id: "view-forward.title" }),
                buttonIcon: <LuCornerUpRight />
            };
        case "backward":
            return {
                defaultClassName: "view-backward",
                buttonLabel: intl.formatMessage({ id: "view-backward.title" }),
                buttonIcon: <LuCornerUpLeft />
            };
    }
}
