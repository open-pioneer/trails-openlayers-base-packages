// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Dialog } from "@chakra-ui/react";

import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";
import type { AsyncVoidCallback, VoidCallback } from "../../types/types";

export function DeleteConfirmationDialog({
    isOpen,
    onDelete,
    onCancel
}: DeleteConfirmationDialogProps): ReactElement {
    const [isDeleting, setDeleting] = useState(false);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const { formatMessage } = useIntl();

    const onDeleteClick = useCallback(async () => {
        try {
            setDeleting(true);
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }, [onDelete]);

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
        <Dialog.Root
            open={isOpen}
            initialFocusEl={() => cancelButtonRef.current}
            role="alertdialog"
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header fontSize="large" fontWeight="bold">
                        {title}
                    </Dialog.Header>
                    <Dialog.Body pt={0}>{message}</Dialog.Body>
                    <Dialog.Footer pt={5}>
                        <Button
                            mr={3}
                            colorScheme="red"
                            loading={isDeleting}
                            loadingText={deleteButtonTitle}
                            onClick={onDeleteClick}
                        >
                            {deleteButtonTitle}
                        </Button>
                        <Button
                            width={110}
                            variant="outline"
                            ref={cancelButtonRef}
                            onClick={onCancel}
                        >
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
    readonly onDelete: AsyncVoidCallback;
    readonly onCancel: VoidCallback;
}
