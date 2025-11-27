// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { FaMousePointer } from "react-icons/fa";
import type { ReactElement } from "react";
import type { VoidCallback } from "../../types/types";

export function SelectButton({ isActive, onClick }: SelectButtonProps): ReactElement {
    const { formatMessage } = useIntl();

    return (
        <Button
            variant="outline"
            width="100%"
            leftIcon={<FaMousePointer />}
            bg={isActive ? "gray.400" : "white"}
            _hover={{ bg: isActive ? "#aebbcb" : "gray.100" }}
            _active={{ bg: "gray.500" }}
            onClick={onClick}
        >
            {formatMessage({ id: "actionSelector.selectButtonTitle" })}
        </Button>
    );
}

interface SelectButtonProps {
    readonly isActive: boolean;
    readonly onClick: VoidCallback;
}
