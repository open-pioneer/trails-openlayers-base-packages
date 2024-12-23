// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";

import { useState, type ReactElement } from "react";

import { MAP_ID } from "./MainMapProvider";
import { MapTool } from "./MapTool";
import { Toolbar, type ToolbarState } from "./Toolbar";

export function WindowApp(): ReactElement {
    const [toolbarState, setToolbarState] = useState<ToolbarState>({});

    return (
        <Flex direction="column" height="full" overflow="hidden">
            <DefaultMapProvider mapId={MAP_ID}>
                <Flex direction="column" flex={1}>
                    <MapContainer>
                        <MapTool
                            tool="bookmarks"
                            toolbarStateKey="bookmarksAreActive"
                            toolbarState={toolbarState}
                            setToolbarState={setToolbarState}
                        />
                        <MapTool
                            tool="legend"
                            toolbarStateKey="legendIsActive"
                            toolbarState={toolbarState}
                            setToolbarState={setToolbarState}
                        />
                        <MapTool
                            tool="measurement"
                            toolbarStateKey="measurementIsActive"
                            toolbarState={toolbarState}
                            setToolbarState={setToolbarState}
                        />
                        <MapTool
                            tool="printing"
                            toolbarStateKey="printingIsActive"
                            toolbarState={toolbarState}
                            setToolbarState={setToolbarState}
                        />
                        <MapTool
                            tool="toc"
                            toolbarStateKey="tocIsActive"
                            toolbarState={toolbarState}
                            setToolbarState={setToolbarState}
                        />
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <Toolbar state={toolbarState} setState={setToolbarState} />
                        </MapAnchor>
                    </MapContainer>
                </Flex>
                <Flex direction="row" gap={3} alignItems="center" justifyContent="center">
                    <CoordinateViewer precision={0} />
                    <ScaleBar />
                    <ScaleViewer />
                </Flex>
            </DefaultMapProvider>
            <Notifier position="bottom-right" />
        </Flex>
    );
}
