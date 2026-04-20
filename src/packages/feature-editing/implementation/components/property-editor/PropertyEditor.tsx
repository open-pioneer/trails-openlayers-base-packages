// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, VStack, useDisclosure } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import type { ReactElement, ReactNode } from "react";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { ButtonRow } from "./ButtonRow";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

export interface PropertyEditorProps {
    readonly children: ReactNode;
}

export function PropertyEditor({ children }: PropertyEditorProps): ReactElement {
    const context = usePropertyFormContext();
    const canSave = useReactiveSnapshot(() => context.isValid, [context]);
    const { open: dialogIsOpen, onOpen: openDialog, onClose: closeDialog } = useDisclosure();

    const onSaveClick = useEvent(async () => {
        const properties = context.getPropertiesAsObject();
        context.feature.setProperties(properties);
        await context.callbacks.onSave();
    });

    const onDeleteClick = useEvent(async () => {
        await context.callbacks.onDelete();
        closeDialog();
    });

    return (
        <>
            <VStack className="editor__property-editor" height="full" gap={5} align="stretch">
                <Box flex={1} overflowY="auto">
                    {children}
                </Box>
                <ButtonRow
                    canSave={canSave}
                    showDeleteButton={context.mode === "update"}
                    onSave={onSaveClick}
                    onDelete={openDialog}
                    onCancel={context.callbacks.onCancel}
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
