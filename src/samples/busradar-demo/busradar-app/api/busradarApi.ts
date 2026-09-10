// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

// Zentrale Basis-URL und Query-Parameter für die Busradar-REST-API.
// Vermeidet duplizierte Host-URLs und Abfahrten-Query-Strings über die API-Module hinweg.
export const BUSRADAR_API_BASE_URL = "https://rest.busradar.conterra.de/prod";

// Endpunkt für Haltestellen (Liste und Abfahrten je Haltestelle).
export const BUSRADAR_STOPS_URL = `${BUSRADAR_API_BASE_URL}/haltestellen`;

// Zeitfenster und maximale Anzahl der abgefragten Abfahrten.
const DEPARTURES_WINDOW_SECONDS = 7200;
const DEPARTURES_MAX_COUNT = 80;
const DEPARTURES_QUERY = `sekunden=${DEPARTURES_WINDOW_SECONDS}&maxanzahl=${DEPARTURES_MAX_COUNT}`;

// Baut die Abfahrten-URL für eine Haltestelle inklusive einheitlicher Query-Parameter.
export function buildStopDeparturesUrl(stopId: string): string {
    return `${BUSRADAR_STOPS_URL}/${encodeURIComponent(stopId)}/abfahrten?${DEPARTURES_QUERY}`;
}
