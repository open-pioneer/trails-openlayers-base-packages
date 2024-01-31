// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { useService } from "open-pioneer:react-hooks";
import { useSnapshot } from "valtio";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../MapConfigProviderImpl";

export function SearchComponent() {
    const { map } = useMapModel(MAP_ID);
    const appModel = useService<AppModel>("ol-app.AppModel");
    const sources = useSnapshot(appModel.state).searchSources;

    function onSearchResultSelected(event: SearchSelectEvent) {
        console.debug("The user selected the following item: ", event.result);
        if (!map) {
            return;
        }

        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        map.highlightAndZoom([geometry], {
            viewPadding: { top: 150, right: 75, bottom: 50, left: 75 }
        });
    }

    function onSearchCleared() {
        console.debug("The user cleared the search");
        map?.removeHighlight();
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
