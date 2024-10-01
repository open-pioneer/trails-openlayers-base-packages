// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ToolButton } from "@open-pioneer/map-ui-components";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { FC, ForwardedRef, forwardRef, RefAttributes } from "react";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useIntl } from "open-pioneer:react-hooks";
import { ViewHistoryModel } from "./ViewHistoryModel";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

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

export interface HistoryProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The view direction.
     *
     * The button will either view forward or view backward depending on this value.
     */
    viewDirection: "forward" | "backward";

    viewModel: ViewHistoryModel;
}

/**
 * Provides a button by which the user can navigate forward or backward in the view history of the map.
 */
export const History: FC<HistoryProps> = forwardRef(function NaviHistory(
    props: HistoryProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const { viewDirection, viewModel } = props;
    const intl = useIntl();
    const { defaultClassName, buttonLabel, buttonIcon } = getDirectionProps(intl, viewDirection);

    const { containerProps } = useCommonComponentProps(classNames("view", defaultClassName), props);
    const { isDisabled } = useReactiveSnapshot(() => {
        return {
            isDisabled: viewDirection == "forward" ? !viewModel.canForward : !viewModel.canBackward
        };
    }, [viewModel]);

    return (
        <ToolButton
            ref={ref}
            label={buttonLabel}
            icon={buttonIcon}
            onClick={viewDirection == "forward" ? viewModel.forward : viewModel.backward}
            {...containerProps}
            isDisabled={isDisabled}
        />
    );
});

function getDirectionProps(intl: PackageIntl, viewDirection: "forward" | "backward") {
    switch (viewDirection) {
        case "forward":
            return {
                defaultClassName: "view-forward",
                buttonLabel: intl.formatMessage({ id: "view-forward.title" }),
                buttonIcon: <FiArrowRight />
            };
        case "backward":
            return {
                defaultClassName: "view-backward",
                buttonLabel: intl.formatMessage({ id: "view-backward.title" }),
                buttonIcon: <FiArrowLeft />
            };
    }
}
