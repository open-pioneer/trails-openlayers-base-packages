// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, forwardRef, RefAttributes } from "react";
import { FiCornerUpLeft, FiCornerUpRight } from "react-icons/fi";
import { useHistoryViewModel } from "./ViewHistoryModel";

export type HistoryForwardProps = Omit<HistoryProps, "viewDirection">;

/**
 * Provides a button by which the user can navigate to the next map view.
 *
 * This component composes {@link History}.
 */
export const HistoryForward: FC<HistoryForwardProps> = forwardRef(function HistoryForward(
    props: HistoryForwardProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    return <History viewDirection="forward" ref={ref} {...props} />;
});

export type HistoryBackwardProps = HistoryForwardProps;

/**
 * Provides a button by which the user can navigate to the previous map view.
 *
 * This component composes {@link History}.
 */
export const HistoryBackward: FC<HistoryBackwardProps> = forwardRef(function HistoryBackward(
    props: HistoryBackwardProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    return <History viewDirection="backward" ref={ref} {...props} />;
});

export interface HistoryProps
    extends CommonComponentProps,
        RefAttributes<HTMLButtonElement>,
        MapModelProps {
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
export const History: FC<HistoryProps> = forwardRef(function History(
    props: HistoryProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const intl = useIntl();
    const { viewDirection } = props;
    const { map } = useMapModel(props);
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
                label={buttonLabel}
                icon={buttonIcon}
                onClick={navigate}
                isDisabled={!canNavigate}
            />
        )
    );
});

function getDirectionProps(intl: PackageIntl, viewDirection: "forward" | "backward") {
    switch (viewDirection) {
        case "forward":
            return {
                defaultClassName: "view-forward",
                buttonLabel: intl.formatMessage({ id: "view-forward.title" }),
                buttonIcon: <FiCornerUpRight />
            };
        case "backward":
            return {
                defaultClassName: "view-backward",
                buttonLabel: intl.formatMessage({ id: "view-backward.title" }),
                buttonIcon: <FiCornerUpLeft />
            };
    }
}
