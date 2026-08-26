// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@chakra-ui/react";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { Notifier } from "@open-pioneer/notifier";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { useIntl } from "open-pioneer:react-hooks";
import { useId, useRef, useState, useCallback } from "react";
import { FiMap } from "react-icons/fi";
import type { TransitDeparture } from "./api/transitDepartures";
import { BusradarLegend } from "./components/BusradarLegend";
import { LayerDrawer } from "./components/LayerDrawer";
import { LayerPanelContent } from "./components/LayerPanelContent";
import { NearestStopsPanel } from "./components/NearestStopsPanel";
import { NearestStopsToggle } from "./components/NearestStopsToggle";
import { TransitStopDeparturesOverlay } from "./components/TransitStopDeparturesOverlay";
import { useBasemapCycle } from "./hooks/useBasemapCycle";
import {
    useBusradarSelection,
    type BusradarDepartureSelectionStatus
} from "./hooks/useBusradarSelection";
import { useNearestStops } from "./hooks/useNearestStops";
import { useTransitStopSelection } from "./hooks/useTransitStopSelection";
import { useTransitStopThemeColors } from "./hooks/useTransitStopThemeColors";
import { MAP_ID } from "./services";
import type { BusradarSelectionDetails } from "./types";

export function MapApp() {
    const intl = useIntl();
    const layerDrawerPanelId = useId();
    const { map } = useMapModel(MAP_ID);
    const { nextBasemap, switchToNextBasemap } = useBasemapCycle(map);
    const [layerDrawerIsOpen, setLayerDrawerIsOpen] = useState(true);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leftMapPanelIsActiveRef = useRef(false);
    leftMapPanelIsActiveRef.current = layerDrawerIsOpen;
    // Mutable Detail-Ref der Busradar-Auswahl für Overlay- und Live-Update-Logik.
    const selectedBusradarDetailsRef = useRef<BusradarSelectionDetails | undefined>(undefined);
    // Cross-Ref: im Umkreissuche-Modus treten Bus-/Haltestellen-Klick-Handler zurück (Exklusivität).
    const nearestStopsActiveRef = useRef(false);
    // Cross-Ref: wählt einen Live-Bus programmatisch anhand seiner Trip-ID aus (Klick auf Abfahrt).
    const selectBusradarVehicleByIdRef = useRef<
        | ((
              tripId: string | undefined,
              focusedStopEta?: BusradarSelectionDetails["focusedStopEta"]
          ) => BusradarDepartureSelectionStatus)
        | undefined
    >(undefined);

    const {
        nearestStopsActive,
        toggleNearestStops,
        closeNearestStops,
        nearestStopsPanel,
        selectedStopId,
        openStopIds,
        onOpenChange,
        departuresByStop,
        retryDepartures,
        handleTransitStopClick
    } = useNearestStops(map, { nearestStopsActiveRef });

    const {
        transitStopsLayerIsActive,
        toggleTransitStopsLayer,
        transitStopPopup,
        closeTransitStopInfo
    } = useTransitStopSelection(map, {
        nearestStopsActiveRef,
        handleNearestStopsTransitStopClick: handleTransitStopClick
    });

    const {
        busradarAvailableLines,
        busradarSelectedLines,
        selectedBusradarTripId,
        selectedBusradarLine,
        addBusradarLineFilter,
        removeBusradarLineFilter,
        resetBusradarLineFilter
    } = useBusradarSelection(map, {
        selectedBusradarDetailsRef,
        leftMapPanelIsActiveRef,
        nearestStopsActiveRef,
        selectBusradarVehicleByIdRef
    });

    useTransitStopThemeColors(map, mapContainerRef);

    // Klick auf eine Abfahrtszeile: den zugehörigen Live-Bus über die bestehende Auswahl-/Detail-
    // logik auswählen. ETA an der angeklickten Haltestelle aus der Abfahrt (Ankunft, Realtime vor
    // Plan). Liefert den Auswahlstatus zurück; bei Nicht-Auswahl bleibt die bisherige Auswahl.
    const handleSelectDeparture = useCallback(
        (departure: TransitDeparture, stopName: string): BusradarDepartureSelectionStatus => {
            const arrivalTime = departure.realtimeArrivalTime ?? departure.plannedArrivalTime;
            const focusedStopEta = {
                stopId: departure.stopId,
                stopSequence: departure.sequence,
                stopName,
                arrivalTime,
                isRealtime: departure.realtimeArrivalTime != null,
                delaySeconds: departure.delaySeconds
            };
            return (
                selectBusradarVehicleByIdRef.current?.(departure.tripId, focusedStopEta) ??
                "not-live"
            );
        },
        []
    );

    const basemapSwitchAriaLabel = intl.formatMessage({ id: "controls.basemapSwitch" });
    const basemapSwitchTooltip = nextBasemap
        ? intl.formatMessage(
              { id: "controls.basemapSwitchWithNext" },
              { basemap: nextBasemap.title }
          )
        : basemapSwitchAriaLabel;
    const nearestStopsLabel = intl.formatMessage({ id: "controls.nearestStops" });

    return (
        <Flex className="basis-opt-app" direction="column">
            <Notifier />
            {map && (
                <DefaultMapProvider map={map}>
                    <Flex
                        ref={mapContainerRef}
                        className={
                            nearestStopsActive
                                ? "basis-opt-app__map-shell basis-opt-app__map-shell--pick-location"
                                : "basis-opt-app__map-shell"
                        }
                        flex="1"
                        direction="column"
                        position="relative"
                        minW={0}
                        minH={0}
                        overflow="hidden"
                    >
                        <MapContainer aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
                            <MapAnchor position="top-left" horizontalGap={0} verticalGap={12}>
                                <LayerDrawer
                                    panelId={layerDrawerPanelId}
                                    isOpen={layerDrawerIsOpen}
                                    onToggle={() => setLayerDrawerIsOpen((isOpen) => !isOpen)}
                                    title={intl.formatMessage({ id: "layerPanel.title" })}
                                    expandLabel={intl.formatMessage({
                                        id: "layerPanel.expand"
                                    })}
                                    collapseLabel={intl.formatMessage({
                                        id: "layerPanel.collapse"
                                    })}
                                >
                                    <LayerPanelContent
                                        busradarAvailableLines={busradarAvailableLines}
                                        busradarSelectedLines={busradarSelectedLines}
                                        transitStopsLayerIsActive={transitStopsLayerIsActive}
                                        onAddBusradarLineFilter={addBusradarLineFilter}
                                        onRemoveBusradarLineFilter={removeBusradarLineFilter}
                                        onResetBusradarLineFilter={resetBusradarLineFilter}
                                        onToggleTransitStopsLayer={toggleTransitStopsLayer}
                                    />
                                </LayerDrawer>
                            </MapAnchor>
                            <MapAnchor position="bottom-right" horizontalGap={4} verticalGap={16}>
                                <Flex
                                    aria-label={intl.formatMessage({
                                        id: "ariaLabel.controls"
                                    })}
                                    direction="column"
                                    gap={1}
                                    padding={1}
                                >
                                    <ToolButton
                                        label={basemapSwitchTooltip}
                                        icon={<FiMap />}
                                        onClick={switchToNextBasemap}
                                        disabled={!nextBasemap}
                                        buttonProps={{
                                            type: "button",
                                            "aria-label": basemapSwitchAriaLabel
                                        }}
                                    />
                                    <Geolocation />
                                    <InitialExtent />
                                    <ZoomIn />
                                    <ZoomOut />
                                </Flex>
                            </MapAnchor>
                            {transitStopPopup && (
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <Box
                                        role="dialog"
                                        aria-label={intl.formatMessage({
                                            id: "transitStops.dialogAriaLabel"
                                        })}
                                    >
                                        <TransitStopDeparturesOverlay
                                            summary={transitStopPopup.summary}
                                            departures={transitStopPopup.departures}
                                            selectedBusLine={selectedBusradarLine}
                                            selectedTripId={selectedBusradarTripId}
                                            loading={transitStopPopup.loading}
                                            error={transitStopPopup.error}
                                            onClose={closeTransitStopInfo}
                                            onSelectDeparture={handleSelectDeparture}
                                        />
                                    </Box>
                                </MapAnchor>
                            )}
                            {nearestStopsPanel && (
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <NearestStopsPanel
                                        state={nearestStopsPanel}
                                        onClose={closeNearestStops}
                                        selectedStopId={selectedStopId}
                                        openStopIds={openStopIds}
                                        onOpenChange={onOpenChange}
                                        departuresByStop={departuresByStop}
                                        retryDepartures={retryDepartures}
                                        onSelectDeparture={handleSelectDeparture}
                                        selectedTripId={selectedBusradarTripId}
                                    />
                                </MapAnchor>
                            )}
                            <MapAnchor position="bottom-left" horizontalGap={8} verticalGap={12}>
                                <Flex direction="row" align="flex-end" gap={2} flexWrap="wrap">
                                    <BusradarLegend />
                                    <Flex align="flex-end" gap={2} flexWrap="wrap">
                                        <NearestStopsToggle
                                            active={nearestStopsActive}
                                            label={nearestStopsLabel}
                                            onToggle={() => {
                                                // Beim Aktivieren ein offenes Haltestellen-Popup
                                                // schließen (beide belegen oben rechts).
                                                if (!nearestStopsActive) {
                                                    closeTransitStopInfo();
                                                }
                                                toggleNearestStops();
                                            }}
                                        />
                                        {nearestStopsActive && (
                                            <Box
                                                role="status"
                                                aria-live="polite"
                                                bg="bg"
                                                color="fg.muted"
                                                borderWidth="1px"
                                                borderColor="border"
                                                borderRadius="md"
                                                boxShadow="md"
                                                px={3}
                                                py={1.5}
                                                fontSize="xs"
                                                fontWeight="medium"
                                                lineHeight="short"
                                                maxWidth="calc(100vw - 2rem)"
                                            >
                                                {intl.formatMessage({
                                                    id: "nearestStops.pickHint"
                                                })}
                                            </Box>
                                        )}
                                    </Flex>
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
                        minHeight="32px"
                        minWidth={0}
                        px={2}
                        bg="bg"
                        overflow="hidden"
                    >
                        <CoordinateViewer precision={2} />
                        <ScaleBar />
                        <ScaleViewer />
                    </Flex>
                </DefaultMapProvider>
            )}
        </Flex>
    );
}
