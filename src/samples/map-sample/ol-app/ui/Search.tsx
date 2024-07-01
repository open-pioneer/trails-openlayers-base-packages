// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { useService } from "open-pioneer:react-hooks";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export function SearchComponent() {
    const { map } = useMapModel(MAP_ID);
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
            mt={5}
            className="search-box"
        >
            <Search
                mapId={MAP_ID}
                sources={sources}
                maxResultsPerGroup={10}
                onSelect={onSearchResultSelected}
                onClear={onSearchCleared}
            />
        </Box>
    );
}
