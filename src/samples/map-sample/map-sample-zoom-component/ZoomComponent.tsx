// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { HTMLAttributes } from "react";

export function ZoomComponent(props: { mapId: string } & HTMLAttributes<HTMLDivElement>) {
    const { mapId, ...rest } = props;
    const { map } = useMapModel(mapId);
    const duration = 200;

    function zoom(zoomIn: boolean) {
        const view = map?.olMap.getView();
        const currZoom = view?.getZoom();
        if (view && currZoom !== undefined) {
            view.animate({ zoom: currZoom + (zoomIn ? 1 : -1), duration: duration });
        }
    }

    return (
        <Flex direction={"column"} gap="1" {...rest}>
            <IconButton
                size="sm"
                aria-label="zoom in"
                colorScheme="teal"
                variant="solid"
                icon={<AddIcon />}
                onClick={() => zoom(true)}
            />
            <IconButton
                size="sm"
                aria-label="zoom out"
                colorScheme="teal"
                variant="solid"
                icon={<MinusIcon />}
                onClick={() => zoom(false)}
            />
        </Flex>
    );
}
