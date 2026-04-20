// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import type { MapModel } from "@open-pioneer/map";
import type { NotificationService } from "@open-pioneer/notifier";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { useCallback, useMemo } from "react";
import type { FeatureWriter, StorageResult } from "../../api/model/FeatureWriter";
import type { EditingStep, InitialStep } from "../../api/model/EditingStep";
import { useEvent } from "@open-pioneer/react-utils";

const LOG = createLogger(sourceId);

const INITIAL: InitialStep = { id: "initial" };

export interface EditingCallbacks {
    readonly onSave: () => Promise<void>;
    readonly onDelete: () => Promise<void>;
    readonly onCancel: () => void;
}

export function useEditingCallbacks(
    mapModel: MapModel,
    editingStep: EditingStep,
    writer: FeatureWriter,
    setEditingStep: (newEditingStep: EditingStep) => void,
    successNotifierDisplayDuration: number | false | undefined,
    failureNotifierDisplayDuration: number | false | undefined
): EditingCallbacks {
    const projection = useReactiveSnapshot(() => mapModel.projection, [mapModel]);

    const showNotifier = useShowNotifier(
        successNotifierDisplayDuration,
        failureNotifierDisplayDuration
    );

    const onSave = useEvent(async () => {
        if (editingStep.id === "creation") {
            const { feature, template } = editingStep;

            let result: StorageResult;
            try {
                result = await writer.addFeature({ feature, template, projection });
                setEditingStep(INITIAL);
            } catch (error) {
                LOG.error("Error creating feature", feature, error);
                result = { kind: "error" };
            }
            showNotifier("create", result);
        } else if (editingStep.id === "update") {
            const { feature, layer } = editingStep;

            let result: StorageResult;
            try {
                result = await writer.updateFeature({ feature, layer, projection });
                setEditingStep(INITIAL);
            } catch (error) {
                LOG.error("Error updating feature", feature, error);
                result = { kind: "error" };
            }
            showNotifier("update", result);
        }
    });
    const onDelete = useEvent(async () => {
        if (editingStep.id === "update") {
            const { feature, layer } = editingStep;

            let result: StorageResult;
            try {
                result = await writer.deleteFeature({ feature, layer, projection });
                setEditingStep(INITIAL);
            } catch (error) {
                LOG.error("Error deleting feature", feature, error);
                result = { kind: "error" };
            }
            showNotifier("delete", result);
        }
    });
    const onCancel = useEvent(async () => {
        setEditingStep(INITIAL);
    });

    return useMemo(
        () => ({
            onSave,
            onDelete,
            onCancel
        }),
        [onSave, onDelete, onCancel]
    );
}

function useShowNotifier(
    successNotifierDisplayDuration: number | false | undefined,
    failureNotifierDisplayDuration: number | false | undefined
) {
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const { formatMessage } = useIntl();

    return useCallback(
        (operation: Operation, result: StorageResult) => {
            if (!result) {
                // void, undefined --> success
                if (successNotifierDisplayDuration !== false) {
                    notifier.success({
                        title: formatMessage({
                            id: getTitleId(operation, true)
                        }),
                        displayDuration: successNotifierDisplayDuration
                    });
                }
            } else {
                if (failureNotifierDisplayDuration !== false) {
                    notifier.error({
                        title: formatMessage({
                            id: getTitleId(operation, false)
                        }),
                        message: result.message,
                        displayDuration: failureNotifierDisplayDuration
                    });
                }
            }
        },
        [formatMessage, notifier, successNotifierDisplayDuration, failureNotifierDisplayDuration]
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

enum TitleId {
    CreationSuccess = "notifier.creationSuccess",
    CreationFailure = "notifier.creationFailure",
    UpdateSuccess = "notifier.updateSuccess",
    UpdateFailure = "notifier.updateFailure",
    DeletionSuccess = "notifier.deletionSuccess",
    DeletionFailure = "notifier.deletionFailure"
}

type Operation = "create" | "update" | "delete";
