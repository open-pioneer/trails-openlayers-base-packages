// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TransitDeparture } from "../api/transitDepartures";
import { TransitStopDeparturesOverlay } from "./TransitStopDeparturesOverlay";

const DEPARTURES: TransitDeparture[] = [
    { id: "trip-11", tripId: "trip-11", line: "11", destination: "Ziel 11", isRealtime: false },
    { id: "trip-14", tripId: "trip-14", line: "14", destination: "Ziel 14", isRealtime: false },
    { id: "trip-22", tripId: "trip-22", line: "22", destination: "Ziel 22", isRealtime: false }
];

function renderOverlay(selectedBusLine?: string) {
    const onClose = vi.fn();
    const renderResult = render(
        <PackageContextProvider>
            <TransitStopDeparturesOverlay
                summary={{ stopId: "stop-1", name: "Testhaltestelle" }}
                departures={DEPARTURES}
                selectedBusLine={selectedBusLine}
                onClose={onClose}
            />
        </PackageContextProvider>
    );
    const popup = renderResult.container.querySelector(".basis-opt-app__transit-popup");

    function rerenderWithLine(line?: string) {
        renderResult.rerender(
            <PackageContextProvider>
                <TransitStopDeparturesOverlay
                    summary={{ stopId: "stop-1", name: "Testhaltestelle" }}
                    departures={DEPARTURES}
                    selectedBusLine={line}
                    onClose={onClose}
                />
            </PackageContextProvider>
        );
        expect(renderResult.container.querySelector(".basis-opt-app__transit-popup")).toBe(popup);
        expect(screen.getByText("Testhaltestelle")).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    }

    return { ...renderResult, onClose, rerenderWithLine };
}

function expectVisibleDestinations(visible: string[]) {
    for (const line of ["11", "14", "22"]) {
        const destination = `Ziel ${line}`;
        if (visible.includes(line)) {
            expect(screen.getByText(destination)).toBeInTheDocument();
        } else {
            expect(screen.queryByText(destination)).toBeNull();
        }
    }
}

describe("TransitStopDeparturesOverlay – reaktiver Buslinienfilter", () => {
    it("folgt bei geöffnetem Popup dem Wechsel von keiner Linie über 11 zu 14", () => {
        const { rerenderWithLine } = renderOverlay();
        expectVisibleDestinations(["11", "14", "22"]);

        rerenderWithLine("11");
        expectVisibleDestinations(["11"]);

        rerenderWithLine("14");
        expectVisibleDestinations(["14"]);
    });

    it("entfernt den Filter bei Busabwahl und folgt einer erneuten Auswahl", () => {
        const { rerenderWithLine } = renderOverlay("14");
        expectVisibleDestinations(["14"]);

        rerenderWithLine(undefined);
        expectVisibleDestinations(["11", "14", "22"]);

        rerenderWithLine("11");
        expectVisibleDestinations(["11"]);
    });
});
