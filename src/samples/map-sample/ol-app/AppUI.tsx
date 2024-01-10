// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Container, Divider, Flex, Text } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Notifier } from "@open-pioneer/notifier";
import { OverviewMap } from "@open-pioneer/overview-map";
import { SectionHeading, TitledSection, ToolButton } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { Toc } from "@open-pioneer/toc";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useEffect, useId, useMemo, useState } from "react";
import {
    PiImagesLight,
    PiListLight,
    PiMapTrifold,
    PiRulerLight,
    PiBookmarksSimpleBold
} from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { AppConfig } from "./AppConfig";
import { Legend } from "@open-pioneer/legend";

export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
    const measurementTitleId = useId();
    const legendTitleId = useId();
    const spatialBookmarkTitle = useId();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const [legendIsActive, setLegendIsActive] = useState<boolean>(true);
    const [showOverviewMap, setShowOverviewMap] = useState<boolean>(true);
    const [bookmarkIsActive, setBookmarkActive] = useState<boolean>(false);
    function toggleBookmark() {
        setBookmarkActive(!bookmarkIsActive);
    }
    const [showToc, setShowToc] = useState<boolean>(true);
    const [maxHeightToc, setMaxHeightToc] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (legendIsActive || measurementIsActive) {
            setMaxHeightToc("300px");
        } else {
            setMaxHeightToc("75vh");
        }
    }, [showToc, legendIsActive, measurementIsActive]);

    function toggleLegend() {
        setLegendIsActive(!legendIsActive);
    }

    function toggleMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

    function toggleOverviewMap() {
        setShowOverviewMap(!showOverviewMap);
    }

    function toggleToc() {
        setShowToc(!showToc);
    }

    const overviewMapLayer = useMemo(
        () =>
            new TileLayer({
                source: new OSM()
            }),
        []
    );

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Notifier position="top-right" />

            <TitledSection
                title={
                    <Box
                        role="region"
                        aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                        textAlign="center"
                        py={1}
                    >
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Default Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer
                        mapId={MAP_ID}
                        role="main"
                        aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                    >
                        <Container centerContent>
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                mt={5}
                                className="search-box"
                            >
                                <SearchComponent />
                            </Box>
                        </Container>
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            {(showToc || legendIsActive || measurementIsActive) && (
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    width={350}
                                    maxWidth={350}
                                >
                                    {showToc && (
                                        <Box role="dialog" aria-labelledby={tocTitleId}>
                                            <TitledSection
                                                title={
                                                    <SectionHeading
                                                        id={tocTitleId}
                                                        size="md"
                                                        mb={2}
                                                    >
                                                        <Text>
                                                            {intl.formatMessage({
                                                                id: "tocTitle"
                                                            })}
                                                        </Text>
                                                    </SectionHeading>
                                                }
                                            >
                                                <Box overflowY="auto" maxHeight={maxHeightToc}>
                                                    <Toc
                                                        mapId={MAP_ID}
                                                        showTools={true}
                                                        basemapSwitcherProps={{
                                                            allowSelectingEmptyBasemap: true
                                                        }}
                                                    />
                                                </Box>
                                            </TitledSection>
                                        </Box>
                                    )}
                                    {showToc && legendIsActive && <Divider mt={4} mb={4} />}
                                    {legendIsActive && (
                                        <Box role="dialog" aria-labelledby={legendTitleId}>
                                            <TitledSection
                                                title={
                                                    <SectionHeading
                                                        id={legendTitleId}
                                                        size="md"
                                                        mb={2}
                                                    >
                                                        {intl.formatMessage({
                                                            id: "legendTitle"
                                                        })}
                                                    </SectionHeading>
                                                }
                                            >
                                                <Box overflowY="auto" maxHeight={300}>
                                                    <Legend mapId={MAP_ID} showBaseLayers={true} />
                                                </Box>
                                            </TitledSection>
                                        </Box>
                                    )}
                                    {(showToc || legendIsActive) && measurementIsActive && (
                                        <Divider mt={4} mb={4} />
                                    )}
                                    {measurementIsActive && (
                                        <Box role="dialog" aria-labelledby={measurementTitleId}>
                                            <TitledSection
                                                title={
                                                    <SectionHeading
                                                        id={measurementTitleId}
                                                        size="md"
                                                        mb={2}
                                                    >
                                                        {intl.formatMessage({
                                                            id: "measurementTitle"
                                                        })}
                                                    </SectionHeading>
                                                }
                                            >
                                                <Measurement mapId={MAP_ID} />
                                            </TitledSection>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={20} verticalGap={20}>
                            {showOverviewMap && (
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                >
                                    <OverviewMap mapId={MAP_ID} olLayer={overviewMapLayer} />
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor horizontalGap={20} position="bottom-left">
                            {bookmarkIsActive && (
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    role="dialog"
                                    width={350}
                                >
                                    <Box role="dialog" aria-labelledby={spatialBookmarkTitle}>
                                        <TitledSection
                                            title={
                                                <SectionHeading
                                                    id={spatialBookmarkTitle}
                                                    size="md"
                                                    mb={2}
                                                >
                                                    {intl.formatMessage({
                                                        id: "spatialBookmarkTitle"
                                                    })}
                                                </SectionHeading>
                                            }
                                        >
                                            <SpatialBookmarks mapId={MAP_ID} />
                                        </TitledSection>
                                    </Box>
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
                            <Flex
                                role="toolbar"
                                aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                                direction="column"
                                gap={1}
                                padding={1}
                            >
                                <ToolButton
                                    label={intl.formatMessage({ id: "spatialBookmarkTitle" })}
                                    icon={<PiBookmarksSimpleBold />}
                                    isActive={bookmarkIsActive}
                                    onClick={toggleBookmark}
                                />
                                <Geolocation mapId={MAP_ID}></Geolocation>
                                <ToolButton
                                    label={intl.formatMessage({ id: "tocTitle" })}
                                    icon={<PiListLight />}
                                    isActive={showToc}
                                    onClick={toggleToc}
                                />
                                <ToolButton
                                    label={intl.formatMessage({ id: "legendTitle" })}
                                    icon={<PiImagesLight />}
                                    isActive={legendIsActive}
                                    onClick={toggleLegend}
                                />
                                <ToolButton
                                    label={intl.formatMessage({ id: "measurementTitle" })}
                                    icon={<PiRulerLight />}
                                    isActive={measurementIsActive}
                                    onClick={toggleMeasurement}
                                />
                                <ToolButton
                                    label={intl.formatMessage({ id: "overviewMapTitle" })}
                                    icon={<PiMapTrifold />}
                                    isActive={showOverviewMap}
                                    onClick={toggleOverviewMap}
                                />
                                <InitialExtent mapId={MAP_ID} />
                                <ZoomIn mapId={MAP_ID} />
                                <ZoomOut mapId={MAP_ID} />
                            </Flex>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
                <Flex
                    role="region"
                    aria-label={intl.formatMessage({ id: "ariaLabel.footer" })}
                    gap={3}
                    alignItems="center"
                    justifyContent="center"
                >
                    <CoordinateViewer mapId={MAP_ID} precision={2} />
                    <ScaleBar mapId={MAP_ID} />
                    <ScaleViewer mapId={MAP_ID} />
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function SearchComponent() {
    const { map } = useMapModel(MAP_ID);
    const appConfig = useService<unknown>("ol-app.AppConfig") as AppConfig;
    const sources = useMemo(() => appConfig.getSearchSources(), [appConfig]);

    function onSearchResultSelected(event: SearchSelectEvent) {
        console.debug("The user selected the following item: ", event.result);
        if (!map) {
            return;
        }

        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        map.highlightAndZoom([geometry]);
    }

    function onSearchCleared() {
        console.debug("The user cleared the search");
        map?.removeHighlight();
    }

    return (
        <Search
            mapId={MAP_ID}
            sources={sources}
            maxResultsPerGroup={10}
            onSelect={onSearchResultSelected}
            onClear={onSearchCleared}
        />
    );
}
