// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button } from "@chakra-ui/react";
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
        <Button
            className="editor__action-selector-select-button"
            variant="outline"
            width="100%"
            bg={isActive ? "gray.400" : "white"}
            _hover={{ bg: isActive ? "#aebbcb" : "gray.100" }}
            _active={{ bg: "gray.500" }}
            onClick={onClick}
        >
            <LuMousePointerClick aria-hidden="true" />
            {formatMessage({ id: "actionSelector.selectButtonTitle" })}
        </Button>
    );
}
