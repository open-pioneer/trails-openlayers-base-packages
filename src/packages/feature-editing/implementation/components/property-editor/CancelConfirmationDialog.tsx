// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Dialog } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, useRef, type ReactElement } from "react";

interface CancelConfirmationDialogProps {
    readonly isOpen: boolean;
    readonly onConfirmCancel: () => void;
    readonly onAbortCancel: () => void;
}

export function CancelConfirmationDialog({
    isOpen,
    onConfirmCancel,
    onAbortCancel
}: CancelConfirmationDialogProps): ReactElement {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const initialFocusEl = useCallback(() => cancelButtonRef.current, []);
    const { formatMessage } = useIntl();

    const { title, message, confirmCancelButtonTitle, abortCancelButtonTitle } = useMemo(
        () => ({
            title: formatMessage({ id: "cancelConfirmationDialog.title" }),
            message: formatMessage({ id: "cancelConfirmationDialog.message" }),
            confirmCancelButtonTitle: formatMessage({
                id: "cancelConfirmationDialog.confirmCancelButtonTitle"
            }),
            abortCancelButtonTitle: formatMessage({
                id: "cancelConfirmationDialog.abortCancelButtonTitle"
            })
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
                            bg="red.solid"
                            color="red.contrast"
                            _hover={{ bg: "red.solid/90" }}
                            loadingText={confirmCancelButtonTitle}
                            onClick={onConfirmCancel}
                        >
                            {confirmCancelButtonTitle}
                        </Button>
                        <Button variant="outline" ref={cancelButtonRef} onClick={onAbortCancel}>
                            {abortCancelButtonTitle}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
