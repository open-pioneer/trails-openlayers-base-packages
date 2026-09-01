// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useState } from "react";
import type { TransitDeparture } from "../api/transitDepartures";
import type { BusradarDepartureSelectionStatus } from "./useBusradarSelection";

/**
 * Geteilte Klick-/Hinweis-Logik für anklickbare Abfahrtszeilen in beiden Haltestellen-Ansichten
 * (Karten-Popover und Umkreissuche-Accordion). Verhindert doppelten Code: ein Klick wählt den
 * zugehörigen Live-Bus über die bestehende Auswahl-/Detaillogik; bei nicht eindeutiger Zuordnung
 * (`unmapped`/`not-live`/`filtered`) bleibt die bisherige Auswahl unverändert und die ID der
 * betroffenen Abfahrt wird für einen lokalisierten Hinweis gemerkt.
 */
export function useDepartureBusSelect(
    onSelectDeparture:
        | ((departure: TransitDeparture, stopName: string) => BusradarDepartureSelectionStatus)
        | undefined,
    stopName: string
) {
    const [notFoundDepartureId, setNotFoundDepartureId] = useState<string>();

    const selectDeparture = useCallback(
        (departure: TransitDeparture) => {
            if (!onSelectDeparture) {
                return;
            }
            const status = onSelectDeparture(departure, stopName);
            setNotFoundDepartureId(status === "selected" ? undefined : departure.id);
        },
        [onSelectDeparture, stopName]
    );

    return {
        /** An `TransitDepartureRow.onSelect` weiterreichen, wenn eine Auswahl möglich sein soll. */
        selectDeparture: onSelectDeparture ? selectDeparture : undefined,
        /** ID der zuletzt nicht eindeutig zuordenbaren Abfahrt; `undefined`, wenn Auswahl gelang. */
        notFoundDepartureId
    };
}
