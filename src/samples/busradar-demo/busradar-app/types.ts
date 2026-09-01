// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import type { BusradarTripStopsResult } from "./api/busradarTripDetails";
import type { TransitDeparture } from "./api/transitDepartures";
import type { BusradarRouteSplit, BusradarSelectedVehicle } from "./map/layers/busradarLayer";

export type BusradarSelectionDetails = {
    vehicle: BusradarSelectedVehicle;
    routeStatus: "loading" | "available" | "unavailable";
    routeSplit?: BusradarRouteSplit;
    tripStops?: BusradarTripStopsResult;
    startStopName?: string;
    endStopName?: string;
    stopsStatus: "idle" | "loading" | "available" | "partial" | "unavailable";
    /**
     * Darzustellende „nächste Haltestelle" des ausgewählten Busses mit voraussichtlicher
     * Ankunftszeit (Epoch s). Zentral aus den Trip-Stops berechnet (allgemeine nächste Haltestelle
     * bzw. priorisierte Zielhaltestelle einer angeklickten Abfahrt, bis diese passiert wurde).
     * `undefined`, wenn aktuell keine nächste Haltestelle zuverlässig bestimmbar ist.
     */
    nextStop?: {
        stopName?: string;
        arrivalTime?: number;
        isRealtime?: boolean;
        delaySeconds?: number;
    };
    /**
     * Priorisierte Zielhaltestelle einer gezielt angeklickten Abfahrtszeile (interner Override-Input
     * für die `nextStop`-Berechnung). Nur gesetzt, wenn die Auswahl über eine Abfahrt erfolgte; bei
     * einem normalen Kartenklick auf den Bus bleibt sie `undefined`.
     */
    focusedStopEta?: {
        stopId?: string;
        stopSequence?: number;
        stopName?: string;
        arrivalTime?: number;
        isRealtime?: boolean;
        delaySeconds?: number;
    };
};

export type TransitStopSummary = {
    stopId: string;
    parentStationId?: string;
    name: string;
    platform?: string;
};

export type TransitStopPopupState = {
    summary: TransitStopSummary;
    departures?: TransitDeparture[];
    loading?: boolean;
    error?: string;
};
