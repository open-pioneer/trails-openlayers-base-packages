// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, ButtonProps, Tooltip, TooltipProps } from "@open-pioneer/chakra-integration";
import {
    FC,
    MouseEvent,
    MouseEventHandler,
    ReactElement,
    RefAttributes,
    forwardRef,
    useState
} from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import classNames from "classnames";

/**
 * Properties supported by {@link ToolButton}.
 */
export interface ToolButtonProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The label for the ToolButton.
     * This value services as the tooltip text and the aria-label.
     *
     * This property is required for a11y reasons because a ToolButton usually only displays an icon.
     */
    label: string;

    /**
     * The icon displayed by the button.
     */
    icon: ReactElement;

    /**
     * If `true`, the button will show a spinner.
     * Defaults to `false`.
     */
    isLoading?: boolean;

    /**
     * If `true`, indicates that the button is currently active with a different style.
     * Defaults to `undefined`.
     *
     * A value of `true` or `false` indicates that the button supports being active (i.e. pressed).
     * In that case the `aria-pressed` attribute will be configured automatically
     * (see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed).
     */
    isActive?: boolean;

    /**
     * If `true`, the button will be disabled.
     * Defaults to `false`.
     */
    isDisabled?: boolean;

    /**
     * The callback that will be called when the user clicks the button.
     */
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;

    /**
     * Additional properties for the `Tooltip` element.
     *
     * Note that the ToolButton also defines some of these props.
     */
    tooltipProps?: Partial<TooltipProps>;

    /**
     * Additional properties for the `Button` element.
     *
     * Note that the ToolButton also defines some of these props.
     */
    buttonProps?: Partial<ButtonProps>;
}

/**
 * An button with a tooltip, used for tool buttons on a map.
 */
export const ToolButton: FC<ToolButtonProps> = forwardRef(function ToolButton(
    props: ToolButtonProps,
    ref
) {
    const {
        label,
        icon,
        onClick: onClickProp,
        isLoading,
        isDisabled,
        isActive,
        tooltipProps,
        buttonProps
    } = props;

    const {
        containerProps: { className: baseClassName, ...containerProps }
    } = useCommonComponentProps("tool-button", props);

    const className = classNames(baseClassName, {
        "tool-button--active": isActive,
        "tool-button--loading": isLoading,
        "tool-button--disabled": isDisabled
    });
    const ariaPressed = typeof isActive === "boolean" ? (isActive ? "true" : "false") : undefined;

    const [tooltipOpen, setTooltipOpen] = useState(false);
    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        // Immediately hide the tooltip. When the label switches in reaction to the click,
        // the tooltip would flicker briefly with the new label.
        setTooltipOpen(false);
        onClickProp?.(e);
    };

    return (
        <Tooltip
            label={label}
            placement="auto"
            openDelay={500}
            {...tooltipProps}
            /* don't allow overwrite because component would break */
            isOpen={tooltipOpen}
            onOpen={() => setTooltipOpen(true)}
            onClose={() => setTooltipOpen(false)}
        >
            <ButtonIgnoringAriaProps
                className={className}
                ref={ref}
                aria-label={label}
                leftIcon={icon}
                iconSpacing={0}
                padding={0}
                isDisabled={isDisabled}
                isLoading={isLoading}
                isActive={isActive}
                aria-pressed={ariaPressed}
                {...containerProps}
                {...buttonProps}
                /* don't allow overwrite because component would break */
                onClick={onClick}
            />
        </Tooltip>
    );
});

/**
 * The tooltip will automatically set 'aria-describedby' when it is being shown.
 * This is redundant because the aria-label already has the same content as the tooltip.
 * This component wraps chakra's button to ignore the *-by attributes.
 */
const ButtonIgnoringAriaProps = forwardRef(function ButtonIgnoringAriaProps(
    props: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>
) {
    const { "aria-labelledby": _label, "aria-describedby": _describedBy, ...rest } = props;
    return <Button ref={ref} {...rest} />;
});
