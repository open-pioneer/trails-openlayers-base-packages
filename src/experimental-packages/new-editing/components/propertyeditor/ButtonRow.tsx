// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex, Button, Spacer } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useIntl } from "open-pioneer:react-hooks";
import { PiTrash } from "react-icons/pi";
import { useCallback, useMemo, useState, type ReactElement } from "react";

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

    const { saveButtonTitle, cancelButtonTitle, deleteButtonTooltip } = useMemo(
        () => ({
            saveButtonTitle: formatMessage({ id: "propertyEditor.saveButtonTitle" }),
            cancelButtonTitle: formatMessage({ id: "propertyEditor.cancelButtonTitle" }),
            deleteButtonTooltip: formatMessage({ id: "propertyEditor.deleteButtonTooltip" })
        }),
        [formatMessage]
    );

    return (
        <Flex flexDirection="row" columnGap={2}>
            {showDeleteButton && (
                <Tooltip content={deleteButtonTooltip}>
                    <Button
                        width={65}
                        variant="outline"
                        colorPalette="red"
                        aria-label={deleteButtonTooltip}
                        disabled={isSaving}
                        onClick={onDelete}
                    >
                        <PiTrash />
                    </Button>
                </Tooltip>
            )}
            <Spacer />
            <Button
                width={100}
                disabled={!canSave}
                loading={isSaving}
                loadingText={saveButtonTitle}
                onClick={onSaveClick}
            >
                {saveButtonTitle}
            </Button>
            <Button width={100} variant="outline" disabled={isSaving} onClick={onCancel}>
                {cancelButtonTitle}
            </Button>
        </Flex>
    );
}

interface ButtonRowProps {
    readonly canSave: boolean;
    readonly showDeleteButton: boolean;

    readonly onSave: () => Promise<void>;
    readonly onDelete: () => void;
    readonly onCancel: () => void;
}
