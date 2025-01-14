// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, VStack, useDisclosure } from "@open-pioneer/chakra-integration";
import { useCallback, type ReactElement, type ReactNode } from "react";

import { ButtonRow } from "./ButtonRow";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { AsyncVoidCallback, VoidCallback } from "../../types/types";

export function PropertyEditor({
    children,
    onSave,
    onDelete,
    onCancel
}: PropertyEditorProps): ReactElement {
    const { mode, isValid, feature, properties } = usePropertyFormContext();
    const { isOpen: dialogIsOpen, onOpen: openDialog, onClose: closeDialog } = useDisclosure();

    const onSaveClick = useCallback(async () => {
        feature.setProperties(properties);
        await onSave();
    }, [feature, properties, onSave]);

    const onDeleteClick = useCallback(async () => {
        await onDelete();
        closeDialog();
    }, [closeDialog, onDelete]);

    return (
        <>
            <VStack height="full" spacing={5} align="stretch">
                <Box flex={1} overflowY="auto">
                    {children}
                </Box>
                <ButtonRow
                    canSave={isValid}
                    showDeleteButton={mode === "update"}
                    onSave={onSaveClick}
                    onDelete={openDialog}
                    onCancel={onCancel}
                />
            </VStack>
            <DeleteConfirmationDialog
                isOpen={dialogIsOpen}
                onDelete={onDeleteClick}
                onCancel={closeDialog}
            />
        </>
    );
}

interface PropertyEditorProps extends PropertyEditorCallbacks {
    readonly children: ReactNode[] | ReactNode;
}

export interface PropertyEditorCallbacks {
    readonly onSave: AsyncVoidCallback;
    readonly onDelete: AsyncVoidCallback;
    readonly onCancel: VoidCallback;
}
