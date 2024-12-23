// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { NotificationService } from "@open-pioneer/notifier";
import { useIntl, useService } from "open-pioneer:react-hooks";
import type { Map } from "ol";
import { useCallback, useMemo } from "react";

import type { PropertyEditorCallbacks } from "../../components/propertyeditor/PropertyEditor";
import type { EditingHandler } from "../../model/EditingHandler";
import type { EditingStep } from "../../model/EditingStep";
import type { ValueSetter } from "../../types/types";

export function useEditingCallbacks(
    map: Map | undefined,
    editingStep: EditingStep,
    editingHandler: EditingHandler,
    setEditingStep: ValueSetter<EditingStep>
): PropertyEditorCallbacks {
    const projection = useMemo(() => map?.getView().getProjection(), [map]);
    const showNotifier = useShowNotifier();

    return useMemo(() => ({
        async onSave() {
            if (editingStep.id === "create-modify") {
                const { feature, template } = editingStep;
                try {
                    await editingHandler.addFeature(feature, template, projection!);
                    showNotifier("create", true);
                    setEditingStep({ id: "none" });
                } catch (error) {
                    showNotifier("create", false, error);
                    console.error("Error creating feature", feature, error);
                }
            } else if (editingStep.id === "update-modify") {
                const { feature, layer } = editingStep;
                try {
                    await editingHandler.updateFeature(feature, layer, projection!);
                    showNotifier("update", true);
                    setEditingStep({ id: "none" });
                } catch (error) {
                    showNotifier("update", false, error);
                    console.error("Error updating feature", feature, error);
                } finally {
                    layer?.getSource()?.refresh();
                }
            }
        },
        async onDelete() {
            if (editingStep.id === "update-modify") {
                const { feature, layer } = editingStep;
                try {
                    await editingHandler.deleteFeature(feature, layer, projection!);
                    showNotifier("delete", true);
                    setEditingStep({ id: "none" });
                } catch (error) {
                    showNotifier("delete", false, error);
                    console.error("Error deleting feature", feature, error);
                } finally {
                    layer?.getSource()?.refresh();
                }
            }
        },
        onCancel() {
            setEditingStep({ id: "none" });
        }
    }), [editingStep, editingHandler, projection, showNotifier, setEditingStep]);
}

function useShowNotifier() {
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const { formatMessage } = useIntl();

    return useCallback((operation: Operation, success: boolean, error?: unknown) => {
        if (success) {
            notifier.success({
                title: formatMessage({
                    id: getTitleId(operation, true)
                }),
                displayDuration: SUCCESS_DISPLAY_DURATION
            });
        } else {
            notifier.error({
                title: formatMessage({
                    id: getTitleId(operation, false)
                }),
                message: error?.toString()
            });
        }
    }, [formatMessage, notifier]);
}

function getTitleId(operation: Operation, success: boolean): TitleId {
    switch (operation) {
        case "create": return success ? TitleId.CreationSuccess : TitleId.CreationFailure;
        case "update": return success ? TitleId.UpdateSuccess : TitleId.UpdateFailure;
        case "delete": return success ? TitleId.DeletionSuccess : TitleId.DeletionFailure;
    }
}

enum TitleId {
    CreationSuccess = "notifier.creationSuccess",
    CreationFailure = "notifier.creationFailure",
    UpdateSuccess = "notifier.updateSuccess",
    UpdateFailure = "notifier.updateFailure",
    DeletionSuccess = "notifier.deletionSuccess",
    DeletionFailure = "notifier.deletionFailure"
}

const SUCCESS_DISPLAY_DURATION = 1500;

type Operation = "create" | "update" | "delete";
