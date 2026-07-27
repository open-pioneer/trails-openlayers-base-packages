// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, chakra, Flex, Icon } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { LuTriangleAlert } from "react-icons/lu";
import { SelectionSource } from "../api";
import { getSourceStatus } from "../view-model";

/**
 * Renders a selection source in the dropdown menu (option or current selection).
 */
export function SelectionSourceItem(props: { source: SelectionSource | undefined }) {
    const source = props.source;
    const label: string | undefined = source?.label;
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

type SimpleStatus =
    | {
          kind: "available";
      }
    | {
          kind: "unavailable";
          reason: string;
      };

function useSourceStatus(source: SelectionSource | undefined): SimpleStatus {
    const intl = useIntl();
    const sourceStatus = useReactiveSnapshot((): SimpleStatus => {
        if (!source) {
            return {
                kind: "unavailable",
                reason: intl.formatMessage({ id: "sourceNotAvailable" })
            };
        }

        const status = getSourceStatus(source);
        if (status.kind === "available") {
            return status;
        }
        return {
            kind: "unavailable",
            reason: status.reason ?? intl.formatMessage({ id: "sourceNotAvailable" })
        };
    }, [source, intl]);
    return sourceStatus;
}
