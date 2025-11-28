// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, VStack } from "@chakra-ui/react";
import { useCallback, useState, type ReactElement, type ReactNode } from "react";

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
    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    const onSaveClick = useCallback(async () => {
        feature.setProperties(properties);
        await onSave();
    }, [feature, properties, onSave]);

    const onDeleteClick = useCallback(async () => {
        await onDelete();
        setDialogIsOpen(false);
    }, [onDelete]);

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
                    onDelete={() => setDialogIsOpen(true)}
                    onCancel={onCancel}
                />
            </VStack>
            <DeleteConfirmationDialog
                isOpen={dialogIsOpen}
                onDelete={onDeleteClick}
                onCancel={() => setDialogIsOpen(false)}
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
