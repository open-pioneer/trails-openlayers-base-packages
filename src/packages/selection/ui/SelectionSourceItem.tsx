// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, chakra, Flex, Icon } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { LuTriangleAlert } from "react-icons/lu";
import { SelectionSource } from "../api";
import { useSourceStatus } from "./useSourceStatus";

/**
 * Renders a selection source in the dropdown menu (option or current selection).
 */
export function SelectionSourceItem(props: { source: SelectionSource | undefined }) {
    const { source } = props;
    const label = useReactiveSnapshot(() => source?.label, [source]);
    const status = useSourceStatus(source);
    const isAvailable = status.kind === "available";
    const clazz = isAvailable
        ? "selection-source-value"
        : "selection-source-value selection-source-value--disabled";

    return (
        <Flex className={clazz} direction="row" alignItems="center" grow={1}>
            {label}
            {status.kind === "unavailable" && (
                <Box ml={2}>
                    <Tooltip
                        content={status.reason}
                        positioning={{ placement: "right" }}
                        openDelay={500}
                    >
                        <chakra.span>
                            <Icon
                                color="red"
                                className="warning-icon"
                                aria-label={status.reason}
                                aria-hidden={undefined} // Overwrite icon default so the label gets read
                            >
                                <LuTriangleAlert />
                            </Icon>
                        </chakra.span>
                    </Tooltip>
                </Box>
            )}
        </Flex>
    );
}
