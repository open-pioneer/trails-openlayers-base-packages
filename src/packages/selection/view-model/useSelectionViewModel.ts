// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { SelectionResult, SelectionSource } from "../api";
import { SelectionCompleteEvent, SelectionSourceChangedEvent } from "../Selection";
import { SelectionViewModel } from "./SelectionViewModel";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { NotificationService } from "@open-pioneer/notifier";
import { useEvent } from "@open-pioneer/react-utils";
import { MapModel } from "@open-pioneer/map";
import { watchValue } from "@conterra/reactivity-core";

export function useSelectionViewModel(
    map: MapModel,
    sources: SelectionSource[],
    onSelectionComplete: ((event: SelectionCompleteEvent) => void) | undefined,
    onSelectionSourceChanged: ((event: SelectionSourceChangedEvent) => void) | undefined
): SelectionViewModel | undefined {
    const intl = useIntl();
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const onComplete = useEvent((source: SelectionSource, results: SelectionResult[]) => {
        onSelectionComplete?.({ source, results });
    });
    const onChange = useEvent((source: SelectionSource | undefined) => {
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
        setViewModel(vm);
        return () => {
            setViewModel(undefined);
            vm.destroy();
        };
    }, [map, intl, notifier, onComplete]);

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

        const handle = watchValue(() => viewModel.currentSource, onChange);
        return () => handle.destroy();
    }, [viewModel, onChange]);

    return viewModel;
}
