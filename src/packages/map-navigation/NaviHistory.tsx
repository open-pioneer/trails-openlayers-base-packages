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

export type NaviHistoryForwardProps = Omit<NaviHistoryProps, "viewDirection">;

/**
 * Provides a button by which the user can view forward the map.
 *
 * This component composes {@link NaviHistory}.
 */
export const NaviHistoryForward: FC<NaviHistoryForwardProps> = forwardRef(
    function NaviHistoryForward(
        props: NaviHistoryForwardProps,
        ref: ForwardedRef<HTMLButtonElement>
    ) {
        return <NaviHistory viewDirection="forward" ref={ref} {...props} />;
    }
);

export type NaviHistoryBackwardProps = NaviHistoryForwardProps;

/**
 * Provides a button by which the user can view backward the map.
 *
 * This component composes {@link NaviHistory}.
 */
export const NaviHistoryBackward: FC<NaviHistoryBackwardProps> = forwardRef(
    function NaviHistoryBackward(
        props: NaviHistoryBackwardProps,
        ref: ForwardedRef<HTMLButtonElement>
    ) {
        return <NaviHistory viewDirection="backward" ref={ref} {...props} />;
    }
);

export interface NaviHistoryProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The view direction.
     *
     * The button will either view forward or view backward depending on this value.
     */
    viewDirection: "forward" | "backward";

    viewModel: ViewHistoryModel;
}

/**
 * Provides a button by which the user can view forwardor view backward of the map.
 */
export const NaviHistory: FC<NaviHistoryProps> = forwardRef(function NaviHistory(
    props: NaviHistoryProps,
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
