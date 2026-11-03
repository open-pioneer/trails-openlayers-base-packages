// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, BoxProps, useSlotRecipe } from "@chakra-ui/react";
import { classNames } from "@open-pioneer/react-utils";
import { useMemo } from "react";

export type TooltipBoxProps = BoxProps;

/**
 * A box that looks like a chakra tooltip.
 *
 * Useful for placing a tooltip-like element at a custom location, for example on the map.
 *
 * Styles are derived from chakra's current theme.
 * Additional styles can be applied via the `css` prop (or any other chakra style props).
 */
export function TooltipBox(props: TooltipBoxProps) {
    const { className, css, ...restProps } = props;
    const tooltipStyles = useSlotRecipe({ key: "tooltip" })();
    const finalCss = useMemo(() => {
        return [tooltipStyles.content, css];
    }, [tooltipStyles.content, css]);

    return <Box className={classNames("tooltip-box", className)} css={finalCss} {...restProps} />;
}
