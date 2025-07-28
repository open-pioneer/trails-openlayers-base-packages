// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Text } from "@chakra-ui/react";
import { ForceAuth } from "@open-pioneer/authentication";
import { DefaultMapProvider, useMapModel } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { MAP_ID } from "../services/MapConfigService";
import { MapContent } from "./MapContent";
import { LoginStatus } from "./LoginStatus";

export function AppUi() {
    return (
        <ForceAuth>
            <AppContent />
        </ForceAuth>
    );
}

function AppContent() {
    const { map, error, kind } = useMapModel(MAP_ID);

    if (kind === "loading") {
        return <Text>Loading...</Text>;
    }
    if (error) {
        // return <Text>Failed to load: {String(error)}</Text>;
        throw error;
    }

    return (
        map && (
            <DefaultMapProvider map={map}>
                <Flex height="100%" direction="column" overflow="hidden">
                    <Notifier />
                    <TitledSection
                        title={
                            <Box role="region" textAlign="center" py={1}>
                                <SectionHeading size={"md"}>
                                    Security.Manager OGC - Map Sample
                                </SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column" position="relative">
                            <LoginStatus />
                            <MapContent />
                        </Flex>
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}
