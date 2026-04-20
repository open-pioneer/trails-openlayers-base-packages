// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Toggle } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { LuMousePointerClick } from "react-icons/lu";
import type { ReactElement } from "react";

interface SelectButtonProps {
    readonly isActive: boolean;
    readonly onClick: () => void;
}

export function SelectButton({ isActive, onClick }: SelectButtonProps): ReactElement {
    const { formatMessage } = useIntl();

    return (
        <Toggle.Root pressed={isActive} asChild>
            <Button
                className="editor__action-selector-select-button"
                variant="outline"
                _hover={{ bg: isActive ? "trails.400" : "trails.100" }}
                _pressed={{ bg: "trails.500", color: "white" }}
                width="calc(100% - 8px)"
                marginX={"4px"}
                onClick={onClick}
            >
                <LuMousePointerClick aria-hidden="true" />
                {formatMessage({ id: "actionSelector.selectButtonTitle" })}
            </Button>
        </Toggle.Root>
    );
}
