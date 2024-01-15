// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FC, ForwardedRef, RefAttributes, forwardRef } from "react";
import { Box, Text } from "@open-pioneer/chakra-integration";
import { CommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";

/**
 * These are properties supported by the {@link FeatureEditing} component.
 */
export interface FeatureEditingProps extends CommonComponentProps, RefAttributes<HTMLDivElement> {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const FeatureEditing: FC<FeatureEditingProps> = forwardRef(function FeatureEditing(
    props: FeatureEditingProps,
    ref: ForwardedRef<HTMLDivElement>
) {
    const { mapId } = props;
    const intl = useIntl();

    return (
        <Box ref={ref}>
            <Text>{intl.formatMessage({ id: "title" })}</Text>
            <Text>{mapId}</Text>
        </Box>
    );
});
