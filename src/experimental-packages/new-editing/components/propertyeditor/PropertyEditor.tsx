// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, VStack, useDisclosure } from "@chakra-ui/react";
import { useCallback, type ReactElement, type ReactNode } from "react";

import { ButtonRow } from "./ButtonRow";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";

export function PropertyEditor({
    children,
    onSave,
    onDelete,
    onCancel
}: PropertyEditorProps): ReactElement {
    const { mode, isValid, feature, properties } = usePropertyFormContext();
    const { open: dialogIsOpen, onOpen: openDialog, onClose: closeDialog } = useDisclosure();

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
            <VStack height="full" gap={5} align="stretch">
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
    readonly onSave: () => Promise<void>;
    readonly onDelete: () => Promise<void>;
    readonly onCancel: () => void;
}
