// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    AccordionItem,
    AccordionItemContent,
    AccordionItemTrigger,
    AccordionRoot,
    Box,
    Button,
    Flex,
    IconButton,
    Text
} from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useIntl } from "open-pioneer:react-hooks";
import { useEffect, useRef, useState, type RefObject } from "react";
import { LuChevronDown, LuMapPin, LuMaximize2, LuMinimize2, LuX } from "react-icons/lu";
import type { TransitDeparture } from "../api/transitDepartures";
import type { BusradarDepartureSelectionStatus } from "../hooks/useBusradarSelection";
import { useDepartureBusSelect } from "../hooks/useDepartureBusSelect";
import type { NearestStopDeparturesState, NearestStopsPanelState } from "../hooks/useNearestStops";
import { useNowSeconds } from "../hooks/useNowSeconds";
import { usePanelAvailableHeight } from "../hooks/usePanelAvailableHeight";
import type { NearestStopResult } from "../utils/nearestStops";
import { filterUpcomingDepartures } from "../utils/transitDepartures";
import { TransitDepartureRow } from "./TransitDepartureRow";

/**
 * Kompaktes Ergebnis-Panel der Umkreissuche (fest oben rechts im Kartencontainer). Zeigt je nach
 * Zustand Lade-, Erfolg- (max. drei Einträge), Leer- oder Fehlermeldung. Die Erfolgs-Einträge sind
 * ein Accordion (Multiple-Modus): Öffnen zentriert die Karte auf die Haltestelle, hebt sie hervor
 * und lädt ihre nächsten Abfahrten; Schließen blendet nur die Abfahrten aus.
 */
export function NearestStopsPanel(props: {
    state: NearestStopsPanelState;
    onClose: () => void;
    selectedStopId: string | undefined;
    openStopIds: string[];
    onOpenChange: (stopIds: string[]) => void;
    departuresByStop: Record<string, NearestStopDeparturesState>;
    retryDepartures: (stopId: string) => void;
    onSelectDeparture?: (
        departure: TransitDeparture,
        stopName: string
    ) => BusradarDepartureSelectionStatus;
    selectedTripId?: string;
}) {
    const intl = useIntl();
    // Scrollcontainer der Erfolgsliste; wird für das Auto-Scrollen beim Öffnen eines Items genutzt.
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Panel-Root für die container-relative Höhenmessung des vergrößerten Zustands.
    const panelRef = useRef<HTMLDivElement>(null);
    // Vergrößerungszustand ist rein panel-lokal und wird beim expliziten Schließen zurückgesetzt
    // (das Panel wird dann in MapApp unmountet). Der Interaction-Toggle lässt das Panel gemountet.
    const [enlarged, setEnlarged] = useState(false);
    const availableHeight = usePanelAvailableHeight(panelRef, enlarged);
    const enlargedActive = enlarged && availableHeight != null;
    const enlargeLabel = intl.formatMessage({
        id: enlarged ? "nearestStops.reduce" : "nearestStops.enlarge"
    });

    return (
        <Box
            ref={panelRef}
            role="dialog"
            aria-label={intl.formatMessage({ id: "nearestStops.title" })}
            bg="bg"
            color="fg"
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            boxShadow="md"
            p={3}
            // Zielbreite ~22rem (vergrößert ~26rem), aber nie breiter als der Kartencontainer: Der
            // MapAnchor begrenzt per maxW=calc(100% - 2*gap) relativ zum Karten-Host (auch als
            // WebComponent in kleinem Container). maxWidth="100%" bindet das Panel an diese
            // Anchor-/Containerbreite und bleibt auf kleinen Kartenbreiten responsiv.
            width={enlarged ? "26rem" : "22rem"}
            maxWidth="100%"
            // Im vergrößerten Zustand füllt das Panel als Flex-Spalte die gemessene, container-relative
            // Höhe; der innere Scrollbereich wächst und scrollt bei Überlauf weiter.
            display={enlargedActive ? "flex" : undefined}
            flexDirection={enlargedActive ? "column" : undefined}
            maxHeight={enlargedActive ? `${availableHeight}px` : undefined}
        >
            <Flex alignItems="flex-start" justifyContent="space-between" gap={2} mb={2}>
                <Text fontSize="sm" fontWeight="semibold" lineHeight="short">
                    {intl.formatMessage({ id: "nearestStops.title" })}
                </Text>
                <Flex gap={1} flexShrink={0}>
                    <Tooltip content={enlargeLabel}>
                        <IconButton
                            variant="ghost"
                            size="2xs"
                            aria-label={enlargeLabel}
                            aria-pressed={enlarged}
                            onClick={() => setEnlarged((value) => !value)}
                        >
                            {enlarged ? <LuMinimize2 /> : <LuMaximize2 />}
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        variant="ghost"
                        size="2xs"
                        aria-label={intl.formatMessage({ id: "transitStops.close" })}
                        onClick={props.onClose}
                    >
                        <LuX />
                    </IconButton>
                </Flex>
            </Flex>
            {props.state.status === "loading" && (
                <Text fontSize="xs" color="fg.muted">
                    {intl.formatMessage({ id: "nearestStops.loading" })}
                </Text>
            )}
            {props.state.status === "error" && (
                <Text fontSize="xs" color="red.solid">
                    {intl.formatMessage({ id: "nearestStops.error" })}
                </Text>
            )}
            {props.state.status === "empty" && (
                <Text fontSize="xs" color="fg.muted">
                    {intl.formatMessage({ id: "nearestStops.empty" })}
                </Text>
            )}
            {props.state.status === "success" && (
                <Box
                    ref={scrollContainerRef}
                    // Kompakt: feste Cap. Vergrößert: wächst als Flex-Kind in die vom Panel
                    // freigegebene, container-relative Höhe und scrollt bei Überlauf weiter.
                    maxH={enlargedActive ? undefined : "min(60vh, 24rem)"}
                    flex={enlargedActive ? "1 1 auto" : undefined}
                    minH={enlargedActive ? 0 : undefined}
                    overflowY="auto"
                    overflowX="hidden"
                    mx={-1}
                    px={1}
                >
                    <AccordionRoot
                        multiple
                        variant="plain"
                        size="sm"
                        value={props.openStopIds}
                        onValueChange={(details) => props.onOpenChange(details.value)}
                    >
                        {props.state.results.map((result) => (
                            <NearestStopsAccordionItem
                                key={result.stop.stopId}
                                result={result}
                                isOpen={props.openStopIds.includes(result.stop.stopId)}
                                selected={result.stop.stopId === props.selectedStopId}
                                departures={props.departuresByStop[result.stop.stopId]}
                                onRetry={props.retryDepartures}
                                scrollContainerRef={scrollContainerRef}
                                onSelectDeparture={props.onSelectDeparture}
                                selectedTripId={props.selectedTripId}
                            />
                        ))}
                    </AccordionRoot>
                </Box>
            )}
        </Box>
    );
}

function NearestStopsAccordionItem(props: {
    result: NearestStopResult;
    isOpen: boolean;
    selected: boolean;
    departures: NearestStopDeparturesState | undefined;
    onRetry: (stopId: string) => void;
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    onSelectDeparture?: (
        departure: TransitDeparture,
        stopName: string
    ) => BusradarDepartureSelectionStatus;
    selectedTripId?: string;
}) {
    const intl = useIntl();
    const stopId = props.result.stop.stopId;
    const name = props.result.stop.name;
    const meters = intl.formatNumber(Math.round(props.result.distanceMeters));
    const distanceLabel = intl.formatMessage({ id: "nearestStops.distanceMeters" }, { meters });

    const itemRef = useRef<HTMLDivElement>(null);
    const { isOpen, scrollContainerRef } = props;
    const departuresStatus = props.departures?.status;

    // Beim Öffnen (und wenn die Abfahrten das Layout vergrößern) sicherstellen, dass Header und
    // die neu eingeblendeten Abfahrten sichtbar sind. Es wird nur um den tatsächlich nötigen
    // Betrag gescrollt; vollständig sichtbare Items lösen keinen Scroll aus. Nicht beim Schließen.
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const item = itemRef.current;
        const container = scrollContainerRef.current;
        if (!item || !container) {
            return;
        }

        let cancelled = false;
        let rafId = 0;
        let lastHeight = -1;
        let stableFrames = 0;
        let frames = 0;

        // Bevorzugt über den Accordion-Animationszyklus (rAF): warten, bis die Item-Höhe stabil
        // ist (Öffnen-Animation/Content-Layout abgeschlossen), dann exakt scrollen.
        const tick = () => {
            if (cancelled) {
                return;
            }
            const height = item.getBoundingClientRect().height;
            if (height === lastHeight) {
                stableFrames += 1;
            } else {
                stableFrames = 0;
                lastHeight = height;
            }
            frames += 1;
            if (stableFrames >= 2 || frames >= 20) {
                ensureItemVisible(container, item);
                return;
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        // Nur ergänzende Absicherung, falls rAF (z. B. im Hintergrund-Tab) nicht läuft.
        const backupTimeout = window.setTimeout(() => {
            if (!cancelled) {
                ensureItemVisible(container, item);
            }
        }, 300);

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            window.clearTimeout(backupTimeout);
        };
    }, [isOpen, departuresStatus, scrollContainerRef]);

    return (
        <AccordionItem ref={itemRef} value={stopId} borderWidth={0}>
            <AccordionItemTrigger
                display="flex"
                width="100%"
                alignItems="center"
                gap={2}
                minW={0}
                px={2}
                py={1}
                borderRadius="md"
                cursor="pointer"
                textAlign="start"
                bg={props.selected ? "bg.muted" : "transparent"}
                aria-current={props.selected ? "true" : undefined}
                aria-label={intl.formatMessage(
                    { id: "nearestStops.itemAriaLabel" },
                    { name, meters }
                )}
                _hover={{ bg: "bg.muted" }}
                _focusVisible={{ outline: "2px solid", outlineColor: "border.emphasized" }}
            >
                <Box asChild color="trails.fg" flex="0 0 auto" aria-hidden="true">
                    <LuMapPin />
                </Box>
                <Text fontSize="sm" flex="1 1 auto" minW={0} truncate>
                    {name}
                </Text>
                <Text
                    fontSize="xs"
                    color="fg.muted"
                    flex="0 0 auto"
                    fontVariantNumeric="tabular-nums"
                >
                    {distanceLabel}
                </Text>
                <Box
                    as="span"
                    aria-hidden="true"
                    display="inline-flex"
                    alignItems="center"
                    flex="0 0 auto"
                    color="fg.muted"
                    transform={props.isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                    transition="transform 150ms ease"
                >
                    <LuChevronDown />
                </Box>
            </AccordionItemTrigger>
            <AccordionItemContent px={2} pt={1} pb={2}>
                <NearestStopDepartures
                    state={props.departures}
                    onRetry={() => props.onRetry(stopId)}
                    stopName={name}
                    onSelectDeparture={props.onSelectDeparture}
                    selectedTripId={props.selectedTripId}
                />
            </AccordionItemContent>
        </AccordionItem>
    );
}

function NearestStopDepartures(props: {
    state: NearestStopDeparturesState | undefined;
    onRetry: () => void;
    stopName: string;
    onSelectDeparture?: (
        departure: TransitDeparture,
        stopName: string
    ) => BusradarDepartureSelectionStatus;
    selectedTripId?: string;
}) {
    const intl = useIntl();
    const state = props.state;
    const nowSeconds = useNowSeconds();
    const { selectDeparture, notFoundDepartureId } = useDepartureBusSelect(
        props.onSelectDeparture,
        props.stopName
    );

    if (!state || state.status === "loading") {
        return (
            <Text fontSize="xs" color="fg.muted">
                {intl.formatMessage({ id: "transitStops.loading" })}
            </Text>
        );
    }

    if (state.status === "empty") {
        return (
            <Text fontSize="xs" color="fg.muted">
                {intl.formatMessage({ id: "transitStops.emptyAll" })}
            </Text>
        );
    }

    if (state.status === "error") {
        return (
            <Flex direction="column" gap={1.5} alignItems="flex-start">
                <Text fontSize="xs" color="red.solid">
                    {intl.formatMessage({ id: "transitStops.loadError" })}
                </Text>
                <Button size="2xs" variant="outline" onClick={props.onRetry}>
                    {intl.formatMessage({ id: "nearestStops.retry" })}
                </Button>
            </Flex>
        );
    }

    const departures = filterUpcomingDepartures(state.departures, nowSeconds).slice(0, 3);
    return (
        <Flex direction="column" gap={1}>
            <Box className="basis-opt-app__transit-departures" as="ol">
                {departures.map((departure) => (
                    <TransitDepartureRow
                        key={departure.id}
                        departure={departure}
                        selected={
                            !!props.selectedTripId && departure.tripId === props.selectedTripId
                        }
                        onSelect={selectDeparture}
                    />
                ))}
            </Box>
            {notFoundDepartureId && (
                <Text fontSize="xs" color="fg.muted">
                    {intl.formatMessage({ id: "transitStops.busNotFound" })}
                </Text>
            )}
        </Flex>
    );
}

/**
 * Scrollt den Container nur um den tatsächlich nötigen Betrag, damit das Item möglichst
 * vollständig sichtbar wird. Bereits vollständig sichtbare Items lösen keinen Scroll aus.
 * Ist das Item höher als der Container, bleibt die Oberkante (Header) sichtbar.
 */
function ensureItemVisible(container: HTMLElement, item: HTMLElement) {
    const c = container.getBoundingClientRect();
    const i = item.getBoundingClientRect();

    let delta = 0;
    if (i.height >= c.height) {
        // Item größer als der sichtbare Bereich: Oberkante/Header sichtbar halten.
        delta = i.top - c.top;
    } else if (i.bottom > c.bottom) {
        // Unterkante liegt außerhalb: nur so weit nach unten wie nötig.
        delta = i.bottom - c.bottom;
    } else if (i.top < c.top) {
        // Oberkante liegt außerhalb (oben): nur so weit nach oben wie nötig.
        delta = i.top - c.top;
    }

    if (Math.abs(delta) < 1) {
        return; // bereits vollständig sichtbar
    }
    container.scrollBy({ top: delta, behavior: "smooth" });
}
