// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, ButtonProps, Icon, Toggle } from "@chakra-ui/react";
import { Tooltip, TooltipProps } from "@open-pioneer/chakra-snippets/tooltip";
import {
    CommonComponentProps,
    mergeChakraProps,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import classNames from "classnames";
import {
    FC,
    MouseEvent,
    MouseEventHandler,
    ReactElement,
    RefAttributes,
    memo,
    useState
} from "react";

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
     *
     * NOTE: You can use raw icons here (e.g. svgs from react-icons).
     * The ToolButton will surround the icon with chakra's `<Icon />` component.
     * This will apply the `aria-hidden` attribute, among other things.
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
export const ToolButton: FC<ToolButtonProps> = memo(function ToolButton(props: ToolButtonProps) {
    const {
        label,
        icon,
        onClick: onClickProp,
        loading,
        disabled,
        active,
        tooltipProps,
        buttonProps = {},
        ref
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

    const mergedButtonProps = mergeChakraProps<ButtonProps>(
        { className, onClick, "aria-label": label, padding: 0, disabled, loading },
        containerProps,
        buttonProps
    );
    let button = (
        <ButtonIgnoringAriaProps ref={ref} {...mergedButtonProps}>
            <Icon>{icon}</Icon>
        </ButtonIgnoringAriaProps>
    );
    if (active != null) {
        // Make sure that only "pressable" buttons receive the aria-pressed attribute.
        button = (
            <Toggle.Root pressed={active} asChild>
                {button}
            </Toggle.Root>
        );
    }

    return (
        <Tooltip
            content={label}
            openDelay={500}
            {...tooltipProps}
            /* don't allow overwrite because component would break */
            open={tooltipOpen}
            onOpenChange={(e) => setTooltipOpen(e.open)}
        >
            {button}
        </Tooltip>
    );
});

/**
 * The tooltip will automatically set 'aria-describedby' when it is being shown.
 * This is redundant because the aria-label already has the same content as the tooltip.
 * This component wraps chakra's button to ignore the *-by attributes.
 */
const ButtonIgnoringAriaProps = function ButtonIgnoringAriaProps(
    props: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }
) {
    const { "aria-labelledby": _label, "aria-describedby": _describedBy, ref, ...rest } = props;
    return <Button ref={ref} {...rest} />;
};
