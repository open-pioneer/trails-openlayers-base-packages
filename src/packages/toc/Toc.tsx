// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Box, Text, BoxProps } from "@open-pioneer/chakra-integration";
import { FC, ForwardedRef, forwardRef, RefAttributes } from "react";
import classNames from "classnames";

export interface TocProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * Additional css class name(s) that will be added to the Toc component.
     */
    className?: string;
}

export const Toc: FC<TocProps> = forwardRef(function Toc(
    props: TocProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { className, ...rest } = props;

    return (
        <Box className={classNames("toc", className)} ref={ref} {...rest}>
            <Text padding={2} backgroundColor="var(--chakra-colors-blackAlpha-500)" as="b">
                Map content{" "}
            </Text>
            <Box backgroundColor="whiteAlpha.800" padding={2}>
                Content
            </Box>
        </Box>
    );
});
