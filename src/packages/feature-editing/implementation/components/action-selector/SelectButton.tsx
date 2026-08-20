// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Button, Toggle } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useIntl } from "open-pioneer:react-hooks";
import { useEffect, useMemo, type ReactElement } from "react";
import { LuMousePointerClick } from "react-icons/lu";

interface SelectButtonProps {
    isAvailable: boolean;
    notAvailableMessage: string | undefined;

    isActive: boolean;
    onClick: () => void;
}

export function SelectButton(props: SelectButtonProps): ReactElement {
    const {
        isAvailable,
        notAvailableMessage: notAvailableMessageProp,
        isActive: isActiveProp,
        onClick
    } = props;
    const intl = useIntl();

    const isActive = isAvailable && isActiveProp;

    const notAvailableMessage = useMemo(() => {
        if (isAvailable) {
            return undefined;
        }
        return (
            notAvailableMessageProp ??
            intl.formatMessage({ id: "selection.defaultNotAvailableMessage" })
        );
    }, [intl, isAvailable, notAvailableMessageProp]);

    useEffect(() => {
        if (notAvailableMessage != null) {
            console.log("Not available", notAvailableMessage);
        } else {
            console.log("Available");
        }
    }, [notAvailableMessage]);

    return (
        <Tooltip disabled={notAvailableMessage == null} content={notAvailableMessage}>
            <Toggle.Root disabled={!isAvailable} pressed={isActive} asChild>
                <Button
                    className="editor__action-selector-select-button"
                    variant="outline"
                    _hover={{ bg: isActive ? "colorPalette.700" : "colorPalette.subtle" }}
                    _pressed={{ bg: "colorPalette.800", color: "colorPalette.contrast" }}
                    // Margin for focus outline
                    marginX="4px"
                    onClick={onClick}
                >
                    <LuMousePointerClick aria-hidden="true" />
                    {isActive
                        ? intl.formatMessage({ id: "actionSelector.selectButtonActiveTitle" })
                        : intl.formatMessage({ id: "actionSelector.selectButtonTitle" })}
                </Button>
            </Toggle.Root>
        </Tooltip>
    );
}
