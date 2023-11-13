// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FC, MouseEventHandler, ReactElement, RefAttributes, forwardRef } from "react";
import { CommonComponentProps, useCommonComponentProps } from "./useCommonComponentProps";
import { Button, ButtonProps, Tooltip, TooltipProps } from "@open-pioneer/chakra-integration";

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
    const { label, icon, onClick, tooltipProps, buttonProps } = props;
    const { containerProps } = useCommonComponentProps("tool-button", props);

    return (
        <Tooltip label={label} placement="auto" openDelay={500} {...tooltipProps}>
            <ButtonIgnoringAriaProps
                ref={ref}
                aria-label={label}
                leftIcon={icon}
                onClick={onClick}
                iconSpacing={0}
                padding={0}
                {...containerProps}
                {...buttonProps}
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
