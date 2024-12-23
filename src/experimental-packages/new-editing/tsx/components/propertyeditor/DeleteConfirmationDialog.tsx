// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader,
    AlertDialogOverlay, Button
} from "@open-pioneer/chakra-integration";

import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";
import type { AsyncVoidCallback, VoidCallback } from "../../types/types";

export function DeleteConfirmationDialog(
    { isOpen, onDelete, onCancel }: DeleteConfirmationDialogProps
): ReactElement {
    const [isDeleting, setDeleting] = useState(false);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const { formatMessage } = useIntl();
    const noOp = useCallback(() => {}, []);

    const onDeleteClick = useCallback(async () => {
        try {
            setDeleting(true);
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }, [onDelete]);

    const { title, message, deleteButtonTitle, cancelButtonTitle } =  useMemo(() => ({
        title: formatMessage({ id: "deleteConfirmationDialog.title" }),
        message: formatMessage({ id: "deleteConfirmationDialog.message" }),
        deleteButtonTitle: formatMessage({ id: "deleteConfirmationDialog.deleteButtonTitle" }),
        cancelButtonTitle: formatMessage({ id: "deleteConfirmationDialog.cancelButtonTitle" })
    }), [formatMessage]);

    return (
        <AlertDialog isOpen={isOpen} onClose={noOp} leastDestructiveRef={cancelButtonRef}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="large" fontWeight="bold">
                        {title}
                    </AlertDialogHeader>
                    <AlertDialogBody pt={0}>{message}</AlertDialogBody>
                    <AlertDialogFooter pt={5}>
                        <Button
                            mr={3}
                            colorScheme="red"
                            isLoading={isDeleting}
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
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

interface DeleteConfirmationDialogProps {
    readonly isOpen: boolean;
    readonly onDelete: AsyncVoidCallback;
    readonly onCancel: VoidCallback;
}
