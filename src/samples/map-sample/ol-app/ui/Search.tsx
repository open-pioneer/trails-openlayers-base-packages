// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { useMapModel } from "@open-pioneer/map";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { AppModel } from "../AppModel";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export function SearchComponent() {
    const intl = useIntl();
    const { map } = useMapModel(); // uses default map configured in AppUI.tsx
    const appModel = useService<AppModel>("ol-app.AppModel");
    const sources = useReactiveSnapshot(() => appModel.searchSources.getItems(), [appModel]);

    function onSearchResultSelected(event: SearchSelectEvent) {
        console.debug("The user selected the following item: ", event.result);
        if (!map) {
            return;
        }

        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        appModel.highlightAndZoom(map, [geometry]);
    }

    function onSearchCleared() {
        console.debug("The user cleared the search");
        appModel.clearHighlight();
    }

    return (
        <Box
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            className="search-box"
            zIndex={3}
            // Center in parent
            position="absolute"
            top={5}
            left="50%"
            transform="translateX(-50%)"
            role="region"
            aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
        >
            <Search
                sources={sources}
                maxResultsPerGroup={10}
                onSelect={onSearchResultSelected}
                onClear={onSearchCleared}
            />
        </Box>
    );
}
