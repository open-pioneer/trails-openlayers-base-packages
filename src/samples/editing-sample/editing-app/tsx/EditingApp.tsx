// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { Notifier } from "@open-pioneer/notifier";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";

import { useCallback, useState, type ReactElement } from "react";
import { PiPencil } from "react-icons/pi";

import { MAP_ID } from "./map/MainMapProvider";
import { EditingComponent } from "./EditingComponent";

export function EditingApp(): ReactElement {
    const [editingIsActive, setEditingActive] = useState(true);

    const toggleEditing = useCallback(() => {
        setEditingActive((editingIsActive) => !editingIsActive);
    }, []);

    return (
        <Flex direction="column" height="full" overflow="hidden">
            <DefaultMapProvider mapId={MAP_ID}>
                <Flex direction="column" flex={1}>
                    <MapContainer>
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <EditingComponent isActive={editingIsActive} />
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <ToolButton
                                label="Editing"
                                icon={<PiPencil />}
                                isActive={editingIsActive}
                                onClick={toggleEditing}
                            />
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
