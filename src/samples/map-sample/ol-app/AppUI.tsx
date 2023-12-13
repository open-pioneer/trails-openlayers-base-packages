// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Divider, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { MapAnchor, MapContainer, MapModel, useMapModel } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Notifier } from "@open-pioneer/notifier";
import { OverviewMap } from "@open-pioneer/overview-map";
import { SectionHeading, TitledSection, ToolButton } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { Selection } from "@open-pioneer/selection";
import { Toc } from "@open-pioneer/toc";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useEffect, useId, useMemo, useState } from "react";
import { PiListLight, PiMapTrifold, PiRulerLight, PiSelectionPlusBold } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { PhotonGeocoder } from "./sources/searchSources";
import { VectorLayerSelectionSource } from "./sources/selectionSources";
import {
    SelectionCompleteEvent,
    SelectionSourceChangedEvent
} from "@open-pioneer/selection/Selection";
import VectorLayer from "ol/layer/Vector";
import type { SelectionSource } from "@open-pioneer/selection";
import OlBaseLayer from "ol/layer/Base";
import VectorSource from "ol/source/Vector";
import { Resource } from "@open-pioneer/core";

const sources = [new PhotonGeocoder("Photon Geocoder", ["city", "street"])];
const SELECTION_LAYER_IDS = ["ogc_kitas", "ogc_kataster"];

type InteractionType = "measurement" | "selection" | undefined;

export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
    const measurementTitleId = useId();
    const selectionTitleId = useId();
    const { map } = useMapModel(MAP_ID);
    const notifier = useService("notifier.NotificationService");
    const [showOverviewMap, setShowOverviewMap] = useState<boolean>(true);
    const [showToc, setShowToc] = useState<boolean>(true);
    const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>();

    const selectionSources = useVectorLayerSelectionSources(map, SELECTION_LAYER_IDS);

    function toggleInteractionType(type: InteractionType) {
        if (type === currentInteractionType) {
            setCurrentInteractionType(undefined);
        } else {
            setCurrentInteractionType(type);
        }
    }

    function toggleMeasurement() {
        toggleInteractionType("measurement");
    }

    function toggleSelection() {
        toggleInteractionType("selection");
    }

    function toggleOverviewMap() {
        setShowOverviewMap(!showOverviewMap);
    }

    function toggleToc() {
        setShowToc(!showToc);
    }

    function onSearchResultSelected(event: SearchSelectEvent) {
        console.debug("The user selected the following item: ", event.result);
        if (!map) {
            console.debug("Map not ready");
            return;
        }

        const geometry = event.result.geometry;
        if (!geometry) {
            console.debug("Result has no geometry");
            return;
        }

        map.highlightAndZoom([geometry]);
    }

    function onSearchCleared() {
        console.debug("The user cleared the search");
        map?.removeHighlight();
    }

    function onSelectionComplete(event: SelectionCompleteEvent) {
        if (!map) {
            console.debug("Map not ready");
            return;
        }

        map?.removeHighlight();
        const geometries = event.results.map((result) => result.geometry);
        if (geometries.length > 0) {
            map.highlightAndZoom(geometries);
        }

        notifier.notify({
            level: "info",
            message: `Found ${event.results.length} results`,
            displayDuration: 2000
        });
    }

    function onSelectionSourceChanged(_: SelectionSourceChangedEvent) {
        map?.removeHighlight();
    }

    const overviewMapLayer = useMemo(
        () =>
            new TileLayer({
                source: new OSM()
            }),
        []
    );

    let currentInteraction: JSX.Element | null = null;
    switch (currentInteractionType) {
        case "selection":
            currentInteraction = (
                <Box role="dialog" aria-labelledby={selectionTitleId}>
                    <TitledSection
                        title={
                            <SectionHeading id={selectionTitleId} size="md" mb={2}>
                                {intl.formatMessage({
                                    id: "selectionTitle"
                                })}
                            </SectionHeading>
                        }
                    >
                        <Selection
                            mapId={MAP_ID}
                            sources={selectionSources}
                            onSelectionComplete={onSelectionComplete}
                            onSelectionSourceChanged={onSelectionSourceChanged}
                        />
                    </TitledSection>
                </Box>
            );
            break;
        case "measurement":
            currentInteraction = (
                <Box role="dialog" aria-labelledby={measurementTitleId}>
                    <TitledSection
                        title={
                            <SectionHeading id={measurementTitleId} size="md" mb={2}>
                                {intl.formatMessage({
                                    id: "measurementTitle"
                                })}
                            </SectionHeading>
                        }
                    >
                        <Measurement mapId={MAP_ID} />
                    </TitledSection>
                </Box>
            );
            break;
    }

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
                                maxResultsPerGroup={10}
                                onSelect={onSearchResultSelected}
                                onClear={onSearchCleared}
                            />
                        </Box>
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            {(showToc || currentInteractionType) && (
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
                                    {showToc && currentInteractionType && <Divider mt={4} mb={4} />}
                                    {currentInteraction}
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
                                    maxWidth={325}
                                >
                                    {showOverviewMap && (
                                        <Box role="dialog">
                                            <OverviewMap
                                                mapId={MAP_ID}
                                                olLayer={overviewMapLayer}
                                            />
                                        </Box>
                                    )}
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
                                    isActive={currentInteractionType === "measurement"}
                                    onClick={toggleMeasurement}
                                />
                                <ToolButton
                                    label={intl.formatMessage({ id: "selectionTitle" })}
                                    icon={<PiSelectionPlusBold />}
                                    isActive={currentInteractionType === "selection"}
                                    onClick={toggleSelection}
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

function useVectorLayerSelectionSources(map: MapModel | undefined, vectorLayerIds: string[]) {
    const [selectionSources, setSelectionSources] = useState<SelectionSource[]>([]);
    const [eventHandler, setEventHandler] = useState<Resource[]>([]);

    function isVectorLayerWithVectorSource(layer: OlBaseLayer) {
        return layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;
    }

    useEffect(() => {
        if (!map) {
            return;
        }
        map.layers.getOperationalLayers().forEach((opLayer) => {
            if (
                !opLayer ||
                !vectorLayerIds.includes(opLayer.id) ||
                !isVectorLayerWithVectorSource(opLayer.olLayer)
            ) {
                return;
            }

            const layerSelectionSource = new VectorLayerSelectionSource(
                opLayer.olLayer as VectorLayer<VectorSource>,
                opLayer.title
            );
            const eventHandler = layerSelectionSource.on("changed:status", () => {
                if (layerSelectionSource.status === "unavailable") map.removeHighlight();
                // TODO: Also listen to "onSourceChanged" event (needs to be implemented)
            });
            setSelectionSources((prev) => {
                if (!prev.includes(layerSelectionSource)) {
                    return [layerSelectionSource, ...prev];
                }
                return prev;
            });
            setEventHandler((prev) => {
                if (!prev.includes(eventHandler)) {
                    return [eventHandler, ...prev];
                }
                return prev;
            });
        });

        return () => {
            eventHandler.forEach((handlder) => handlder.destroy());
        };
    }, [map]);

    return selectionSources;
}
