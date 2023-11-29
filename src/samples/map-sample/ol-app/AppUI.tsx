// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Divider, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Notifier } from "@open-pioneer/notifier";
import { OverviewMap } from "@open-pioneer/overview-map";
import { SectionHeading, TitledSection, ToolButton } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Search } from "@open-pioneer/search";
import { Toc } from "@open-pioneer/toc";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { useIntl } from "open-pioneer:react-hooks";
import { useId, useMemo, useState } from "react";
import { PiListLight, PiMapTrifold, PiRulerLight } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { NominatimGeocoder } from "./search-source-examples/testSources";
import { OgcFeatureSearchSource } from "@open-pioneer/ogc-features";

const sources = [
    new OgcFeatureSearchSource("Bergbauberechtigungen", {
        baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
        collectionId: "managementrestrictionorregulationzone",
        searchProperty: "thematicId",
        labelProperty: "name",
        renderLabelFunction(feature) {
            return feature?.properties?.name + " (" + feature?.id + ")";
        }
    }),
    new OgcFeatureSearchSource("Verwaltungseinheit", {
        baseUrl: "https://ogc-api.nrw.de/lika/v1",
        collectionId: "verwaltungseinheit",
        searchProperty: "name",
        rewriteUrlFunction(url) {
            url.searchParams.set("limit", "1");
            url.searchParams.set("properties", "name"); // return `name` inside of `features[].properties` only
            console.log(url.toString());
            return url;
        }
    }),
    new OgcFeatureSearchSource("Feldblöcke", {
        baseUrl: "https://ogc-api.nrw.de/inspire-lc-fb/v1",
        collectionId: "landcoverunit",
        searchProperty: "flik"
    }),
    new OgcFeatureSearchSource("Weinberge", {
        baseUrl: "https://demo.ldproxy.net/vineyards",
        collectionId: "vineyards",
        searchProperty: "name"
    }),
    new NominatimGeocoder("city", "Städte"),
    new NominatimGeocoder("street", "Straßen")
];

export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
    const measurementTitleId = useId();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const [showOverviewMap, setShowOverviewMap] = useState<boolean>(true);
    const [showToc, setShowToc] = useState<boolean>(true);

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
                        <Box
                            backgroundColor="white"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                            mt={5}
                            className="search-top-center-placement"
                        >
                            <Search
                                mapId={MAP_ID}
                                sources={sources}
                                onSelect={(event) => {
                                    console.debug(
                                        "The user selected the following item: ",
                                        event.result
                                    );
                                }}
                                onClear={() => {
                                    console.debug("The user cleared the selected search item");
                                }}
                            />
                        </Box>
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            {(showToc || measurementIsActive) && (
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
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
                                                        {intl.formatMessage({ id: "tocTitle" })}
                                                    </SectionHeading>
                                                }
                                            >
                                                <Toc
                                                    mapId={MAP_ID}
                                                    basemapSwitcherProps={{
                                                        allowSelectingEmptyBasemap: true
                                                    }}
                                                />
                                            </TitledSection>
                                        </Box>
                                    )}
                                    {showToc && measurementIsActive && <Divider mt={4} mb={4} />}
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
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
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
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
                            <Flex
                                role="toolbar"
                                aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                                direction="column"
                                gap={1}
                                padding={1}
                            >
                                <Geolocation mapId={MAP_ID}></Geolocation>
                                <ToolButton
                                    label={intl.formatMessage({ id: "tocTitle" })}
                                    icon={<PiListLight />}
                                    isActive={showToc}
                                    onClick={toggleToc}
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
