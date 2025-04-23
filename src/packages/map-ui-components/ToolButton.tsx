// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, ButtonProps, Toggle} from "@chakra-ui/react";
import { Tooltip, TooltipProps} from "@open-pioneer/chakra-snippets/tooltip";
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
    loading?: boolean;

    /**
     * If `true`, indicates that the button is currently active with a different style.
     * Defaults to `undefined`.
     *
     * A value of `true` or `false` indicates that the button supports being active (i.e. pressed).
     * In that case the `aria-pressed` attribute will be configured automatically
     * (see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed).
     */
    active?: boolean;

    /**
     * If `true`, the button will be disabled.
     * Defaults to `false`.
     */
    disabled?: boolean;

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
        loading,
        disabled,
        active,
        tooltipProps,
        buttonProps
    } = props;

    const {
        containerProps: { className: baseClassName, ...containerProps }
    } = useCommonComponentProps("tool-button", props);

    const className = classNames(baseClassName, {
        "tool-button--active": active,
        "tool-button--loading": loading,
        "tool-button--disabled": disabled
    });

    const [tooltipOpen, setTooltipOpen] = useState(false);
    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        // Immediately hide the tooltip. When the label switches in reaction to the click,
        // the tooltip would flicker briefly with the new label.
        setTooltipOpen(false);
        onClickProp?.(e);
    };

    return (
        <Tooltip
            content={label}
            openDelay={500}
            {...tooltipProps}
            /* don't allow overwrite because component would break */
            open={tooltipOpen}
            onOpenChange={(e) => setTooltipOpen(e.open)}
        >
            <Toggle.Root pressed={active} /*toggles aria-pressed*/ asChild>
                <ButtonIgnoringAriaProps
                    className={className}
                    ref={ref}
                    aria-label={label}
                    padding={0}
                    disabled={disabled}
                    loading={loading}
                    {...containerProps}
                    {...buttonProps}
                    /* don't allow overwrite because component would break */
                    onClick={onClick}
                >
                    {icon}
                </ButtonIgnoringAriaProps>
            </Toggle.Root>
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
