// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Selection } from "@open-pioneer/selection";
import {
    SelectionCompleteEvent,
    SelectionSourceChangedEvent
} from "@open-pioneer/selection/Selection";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useId } from "react";
import { useSnapshot } from "valtio";
import { AppConfig } from "../AppConfig"; // TODO
import { MAP_ID } from "../MapConfigProviderImpl"; // TODO

export function SelectionComponent() {
    const intl = useIntl();
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const selectionTitleId = useId();
    const { map } = useMapModel(MAP_ID);
    const appConfig = useService<unknown>("ol-app.AppConfig") as AppConfig;
    const sources = useSnapshot(appConfig.state).selectionSources;

    function onSelectionComplete(event: SelectionCompleteEvent) {
        const results = event.results;

        if (!map) {
            console.debug("Map not ready");
            return;
        }

        map?.removeHighlight();
        const geometries = results.map((result) => result.geometry);
        if (geometries.length > 0) {
            map.highlightAndZoom(geometries, {
                viewPadding: { top: 150, right: 75, bottom: 50, left: 75 }
            });
        }

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
        map?.removeHighlight();
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
