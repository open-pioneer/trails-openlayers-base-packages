// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { FormatOptions } from "@open-pioneer/result-list";
import {
    Selection,
    SelectionCompleteEvent,
    SelectionSourceChangedEvent
} from "@open-pioneer/selection";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useId } from "react";
import { useSnapshot } from "valtio";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../MapConfigProviderImpl";

export function SelectionComponent() {
    const intl = useIntl();
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const selectionTitleId = useId();
    const { map } = useMapModel(MAP_ID);
    const appModel = useService<AppModel>("ol-app.AppModel");
    const sources = useSnapshot(appModel.state).selectionSources;
    const sourceMetadata = useSnapshot(appModel.state).sourceMetadata;
    const formatOptions: FormatOptions = {
        numberOptions: {
            maximumFractionDigits: 3
        },
        dateOptions: {
            dateStyle: "medium",
            timeStyle: "medium",
            timeZone: "UTC"
        }
    };

    function onSelectionComplete(event: SelectionCompleteEvent) {
        const { source, results } = event;

        if (!map) {
            console.debug("Map not ready");
            return;
        }

        const geometries = results.map((result) => result.geometry);
        if (geometries.length > 0) {
            appModel.zoom(map, geometries);
        }

        const currentMetadata = sourceMetadata.get(source);
        if (!currentMetadata) {
            console.warn("Can not show results because no metadata could be found");
            return;
        }

        appModel.setResultListInput({
            columns: currentMetadata,
            data: results,
            formatOptions: formatOptions
        });

        notifier.notify({
            level: "info",
            message: intl.formatMessage(
                {
                    id: "foundResults"
                },
                { resultsCount: results.length }
            ),
            displayDuration: 4000
        });
    }

    function onSelectionSourceChanged(_: SelectionSourceChangedEvent) {
        appModel.clearPreviousHighlight();
    }

    return (
        <Box role="dialog" aria-labelledby={selectionTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={selectionTitleId} size="md" mb={2}>
                        {intl.formatMessage({
                            id: "selectionTitle"
                        })}
                    </SectionHeading>
                }
            >
                <Selection
                    mapId={MAP_ID}
                    sources={sources}
                    onSelectionComplete={onSelectionComplete}
                    onSelectionSourceChanged={onSelectionSourceChanged}
                />
            </TitledSection>
        </Box>
    );
}
