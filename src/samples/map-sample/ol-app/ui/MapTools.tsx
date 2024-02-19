// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { Geolocation } from "@open-pioneer/geolocation";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/react-utils";
import { useIntl, useService } from "open-pioneer:react-hooks";
import {
    PiBookmarksSimpleBold,
    PiImagesLight,
    PiListLight,
    PiListMagnifyingGlassFill,
    PiMapTrifold,
    PiRulerLight,
    PiSelectionPlusBold
} from "react-icons/pi";
import { MAP_ID } from "../MapConfigProviderImpl";
import { AppModel } from "../AppModel";
import { useSnapshot } from "valtio";

export interface ToolState {
    bookmarksActive: boolean;
    tocActive: boolean;
    legendActive: boolean;
    measurementActive: boolean;
    selectionActive: boolean;
    overviewMapActive: boolean;
}

export interface MapToolsProps {
    /**
     * Controls the `active` state of all tool buttons.
     */
    toolState: ToolState;

    /**
     * Called by the component when a tool button shall be toggled on or off.
     */
    onToolStateChange(toolStateName: keyof ToolState, newValue: boolean): void;
}

export function MapTools(props: MapToolsProps) {
    const { toolState, onToolStateChange } = props;
    const intl = useIntl();
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const resultListState = useSnapshot(appModel.state).resultListState;
    const resultListOpen = resultListState.open;

    const toggleToolState = (name: keyof ToolState) => {
        onToolStateChange(name, !toolState[name]);
    };

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="column"
            gap={1}
            padding={1}
        >
            {resultListState.input && (
                <ToolButton
                    label={intl.formatMessage({ id: "resultListTitle" })}
                    icon={<PiListMagnifyingGlassFill />}
                    isActive={resultListState.open}
                    onClick={() => appModel.setResultListVisibility(!resultListOpen)}
                />
            )}
            <ToolButton
                label={intl.formatMessage({ id: "spatialBookmarkTitle" })}
                icon={<PiBookmarksSimpleBold />}
                isActive={toolState.bookmarksActive}
                onClick={() => toggleToolState("bookmarksActive")}
            />
            <Geolocation mapId={MAP_ID}></Geolocation>
            <ToolButton
                label={intl.formatMessage({ id: "tocTitle" })}
                icon={<PiListLight />}
                isActive={toolState.tocActive}
                onClick={() => toggleToolState("tocActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "legendTitle" })}
                icon={<PiImagesLight />}
                isActive={toolState.legendActive}
                onClick={() => toggleToolState("legendActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "measurementTitle" })}
                icon={<PiRulerLight />}
                isActive={toolState.measurementActive}
                onClick={() => toggleToolState("measurementActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "selectionTitle" })}
                icon={<PiSelectionPlusBold />}
                isActive={toolState.selectionActive}
                onClick={() => toggleToolState("selectionActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "overviewMapTitle" })}
                icon={<PiMapTrifold />}
                isActive={toolState.overviewMapActive}
                onClick={() => toggleToolState("overviewMapActive")}
            />
            <InitialExtent mapId={MAP_ID} />
            <ZoomIn mapId={MAP_ID} />
            <ZoomOut mapId={MAP_ID} />
        </Flex>
    );
}
