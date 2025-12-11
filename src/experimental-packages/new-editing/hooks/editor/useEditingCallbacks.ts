// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { createLogger } from "@open-pioneer/core";
import type { MapModel } from "@open-pioneer/map";
import type { NotificationService } from "@open-pioneer/notifier";

import { useCallback, useMemo } from "react";

import type { PropertyEditorCallbacks } from "../../components/propertyeditor/PropertyEditor";
import type { EditingHandler } from "../../model/EditingHandler";
import type { EditingStep } from "../../model/EditingStep";
import type { ValueSetter } from "../../types/types";

export function useEditingCallbacks(
    mapModel: MapModel | undefined,
    editingStep: EditingStep,
    editingHandler: EditingHandler,
    setEditingStep: ValueSetter<EditingStep>
): PropertyEditorCallbacks {
    const projection = useReactiveSnapshot(() => mapModel?.projection, [mapModel]);
    const showNotifier = useShowNotifier();

    return useMemo(
        () => ({
            async onSave() {
                if (editingStep.id === "create-modify") {
                    const { feature, template } = editingStep;
                    try {
                        await editingHandler.addFeature(feature, template, projection);
                        showNotifier("create", true);
                        setEditingStep({ id: "none" });
                    } catch (error) {
                        LOG.error("Error creating feature", feature, error);
                        showNotifier("create", false, error);
                    }
                } else if (editingStep.id === "update-modify") {
                    const { feature, olLayer } = editingStep;
                    try {
                        await editingHandler.updateFeature(feature, olLayer, projection);
                        showNotifier("update", true);
                        setEditingStep({ id: "none" });
                    } catch (error) {
                        LOG.error("Error updating feature", feature, error);
                        showNotifier("update", false, error);
                    }
                }
            },
            async onDelete() {
                if (editingStep.id === "update-modify") {
                    const { feature, olLayer } = editingStep;
                    try {
                        await editingHandler.deleteFeature(feature, olLayer, projection);
                        showNotifier("delete", true);
                        setEditingStep({ id: "none" });
                    } catch (error) {
                        LOG.error("Error deleting feature", feature, error);
                        showNotifier("delete", false, error);
                    } finally {
                        olLayer?.getSource()?.refresh();
                    }
                }
            },
            onCancel() {
                setEditingStep({ id: "none" });
            }
        }),
        [editingStep, editingHandler, projection, showNotifier, setEditingStep]
    );
}

function useShowNotifier() {
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const { formatMessage } = useIntl();

    return useCallback(
        (operation: Operation, success: boolean, error?: unknown) => {
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
        },
        [formatMessage, notifier]
    );
}

function getTitleId(operation: Operation, success: boolean): TitleId {
    switch (operation) {
        case "create":
            return success ? TitleId.CreationSuccess : TitleId.CreationFailure;
        case "update":
            return success ? TitleId.UpdateSuccess : TitleId.UpdateFailure;
        case "delete":
            return success ? TitleId.DeletionSuccess : TitleId.DeletionFailure;
    }
}

const LOG = createLogger("new-editing:useEditingCallbacks");

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
