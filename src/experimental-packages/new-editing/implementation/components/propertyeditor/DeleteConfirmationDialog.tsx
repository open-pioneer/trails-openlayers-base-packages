// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Dialog } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

export function DeleteConfirmationDialog({
    isOpen,
    onDelete,
    onCancel
}: DeleteConfirmationDialogProps): ReactElement {
    const [isDeleting, setDeleting] = useState(false);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const initialFocusEl = useCallback(() => cancelButtonRef.current, []);
    const { formatMessage } = useIntl();

    const onDeleteClick = useEvent(async () => {
        try {
            setDeleting(true);
            await onDelete();
        } finally {
            setDeleting(false);
        }
    });

    const { title, message, deleteButtonTitle, cancelButtonTitle } = useMemo(
        () => ({
            title: formatMessage({ id: "deleteConfirmationDialog.title" }),
            message: formatMessage({ id: "deleteConfirmationDialog.message" }),
            deleteButtonTitle: formatMessage({ id: "deleteConfirmationDialog.deleteButtonTitle" }),
            cancelButtonTitle: formatMessage({ id: "deleteConfirmationDialog.cancelButtonTitle" })
        }),
        [formatMessage]
    );

    return (
        <Dialog.Root open={isOpen} initialFocusEl={initialFocusEl} role="alertdialog">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header fontSize="large" fontWeight="bold">
                        {title}
                    </Dialog.Header>
                    <Dialog.Body>{message}</Dialog.Body>
                    <Dialog.Footer>
                        <Button
                            colorPalette="red"
                            _hover={{ bg: "red.800" }}
                            loading={isDeleting}
                            loadingText={deleteButtonTitle}
                            onClick={onDeleteClick}
                        >
                            {deleteButtonTitle}
                        </Button>
                        <Button variant="outline" ref={cancelButtonRef} onClick={onCancel}>
                            {cancelButtonTitle}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

interface DeleteConfirmationDialogProps {
    readonly isOpen: boolean;
    readonly onDelete: () => Promise<void>;
    readonly onCancel: () => void;
}
