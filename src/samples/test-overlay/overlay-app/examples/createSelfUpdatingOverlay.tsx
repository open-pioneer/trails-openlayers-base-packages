// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex, Icon } from "@chakra-ui/react";
import { MapModel } from "@open-pioneer/map";
import { useEffect, useState } from "react";
import { LuCalendarClock } from "react-icons/lu";

/**
 * Creates an overlay with fixed `content`, where the content updates itself on state changes.
 */
export function createSelfUpdatingOverlay(map: MapModel) {
    return map.overlays.add({
        positioning: "center-center",
        stopEvent: false,
        position: [410000, 5760000],
        content: <SelfUpdatingOverlay />
    });
}

function SelfUpdatingOverlay() {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Flex
            bg={"whiteAlpha.700"}
            borderWidth={3}
            borderColor={"gray.700"}
            rounded={20}
            p={2}
            alignItems={"center"}
        >
            <Icon size="lg" mr={1} color={"gray.700"}>
                <LuCalendarClock />
            </Icon>
            {date.toLocaleString()}
        </Flex>
    );
}
