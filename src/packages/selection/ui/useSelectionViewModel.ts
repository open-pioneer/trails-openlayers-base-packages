// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { watchValue } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useEffect, useEffectEvent, useState } from "react";
import { SelectionResult, SelectionSource } from "../api";
import { SelectionViewModel } from "../view-model";
import { SelectionCompleteEvent, SelectionSourceChangedEvent } from "./Selection";

/**
 * Initializes the (internal) view model used by the selection component.
 *
 * The view model contains the primary widget state.
 * It is a long lived instance that is updated in place when relevant react props are changed.
 */
export function useSelectionViewModel(
    map: MapModel,
    sources: SelectionSource[],
    onSelectionComplete: ((event: SelectionCompleteEvent) => void) | undefined,
    onSelectionSourceChanged: ((event: SelectionSourceChangedEvent) => void) | undefined
): SelectionViewModel | undefined {
    const intl = useIntl();
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const onComplete = useEffectEvent((source: SelectionSource, results: SelectionResult[]) => {
        onSelectionComplete?.({ source, results });
    });
    const onChange = useEffectEvent((source: SelectionSource | undefined) => {
        onSelectionSourceChanged?.({ source });
    });

    // Construct view model
    const [viewModel, setViewModel] = useState<SelectionViewModel>();
    useEffect(() => {
        const vm = new SelectionViewModel({
            map,
            onComplete,
            onError() {
                notifier.notify({
                    level: "error",
                    message: intl.formatMessage({ id: "selectionFailed" })
                });
            },
            messages: {
                active: intl.formatMessage({ id: "tooltip" }),
                inactive: intl.formatMessage({ id: "disabledTooltip" }),
                noSource: intl.formatMessage({ id: "noSourceTooltip" })
            }
        });

        // TODO: intl reactive

        setViewModel(vm);
        return () => {
            setViewModel(undefined);
            vm.destroy();
        };
    }, [map, intl, notifier]);

    // Sync sources --> view model
    useEffect(() => {
        if (viewModel) {
            viewModel.sources = sources;
        }
    }, [viewModel, sources]);

    // Sync current source --> react callbacks
    useEffect(() => {
        if (!viewModel) {
            return;
        }

        const handle = watchValue(() => viewModel.currentSource, onChange, {
            immediate: true
        });
        return () => handle.destroy();
    }, [viewModel]);

    return viewModel;
}
