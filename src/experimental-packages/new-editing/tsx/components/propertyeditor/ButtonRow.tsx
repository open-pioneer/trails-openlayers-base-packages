// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex, Button, Spacer } from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
import { PiTrash } from "react-icons/pi";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import type { AsyncVoidCallback, VoidCallback } from "../../types/types";

export function ButtonRow({
    canSave,
    showDeleteButton,
    onSave,
    onDelete,
    onCancel
}: ButtonRowProps): ReactElement {
    const [isSaving, setSaving] = useState(false);

    const onSaveClick = useCallback(async () => {
        try {
            setSaving(true);
            await onSave();
        } finally {
            setSaving(false);
        }
    }, [onSave]);

    const { formatMessage } = useIntl();

    const { saveButtonTitle, cancelButtonTitle, deleteButtonAriaLabel } = useMemo(
        () => ({
            saveButtonTitle: formatMessage({ id: "propertyEditor.saveButtonTitle" }),
            cancelButtonTitle: formatMessage({ id: "propertyEditor.cancelButtonTitle" }),
            deleteButtonAriaLabel: formatMessage({ id: "propertyEditor.deleteButtonAriaLabel" })
        }),
        [formatMessage]
    );

    return (
        <Flex flexDirection="row" columnGap={2}>
            {showDeleteButton && (
                <Button
                    width={65}
                    variant="outline"
                    colorScheme="red"
                    aria-label={deleteButtonAriaLabel}
                    isDisabled={isSaving}
                    onClick={onDelete}
                >
                    <PiTrash />
                </Button>
            )}
            <Spacer />
            <Button
                width={110}
                isDisabled={!canSave}
                isLoading={isSaving}
                loadingText={saveButtonTitle}
                onClick={onSaveClick}
            >
                {saveButtonTitle}
            </Button>
            <Button width={110} variant="outline" isDisabled={isSaving} onClick={onCancel}>
                {cancelButtonTitle}
            </Button>
        </Flex>
    );
}

interface ButtonRowProps {
    readonly canSave: boolean;
    readonly showDeleteButton: boolean;

    readonly onSave: AsyncVoidCallback;
    readonly onDelete: VoidCallback;
    readonly onCancel: VoidCallback;
}
