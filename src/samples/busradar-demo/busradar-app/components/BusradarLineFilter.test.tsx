// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusradarLineFilter } from "./BusradarLineFilter";

function renderFilter(config: { availableLines: string[]; selectedLines?: string[] }) {
    const onAddLine = vi.fn();
    const onRemoveLine = vi.fn();
    const onReset = vi.fn();
    const utils = render(
        <PackageContextProvider>
            <BusradarLineFilter
                availableLines={config.availableLines}
                selectedLines={config.selectedLines ?? []}
                onAddLine={onAddLine}
                onRemoveLine={onRemoveLine}
                onReset={onReset}
            />
        </PackageContextProvider>
    );
    return { ...utils, onAddLine, onRemoveLine, onReset };
}

function lineButton(line: string) {
    return screen.getByText(line).closest("button");
}

describe("BusradarLineFilter", () => {
    it("zeigt alle verfügbaren Linien direkt als Toggle-Buttons", () => {
        const { container } = renderFilter({ availableLines: ["R1", "S2", "N3"] });

        expect(screen.getByText("R1")).toBeInTheDocument();
        expect(screen.getByText("S2")).toBeInTheDocument();
        expect(screen.getByText("N3")).toBeInTheDocument();
        expect(container.querySelectorAll("button[aria-pressed]")).toHaveLength(3);
    });

    it("enthält kein Suchfeld", () => {
        renderFilter({ availableLines: ["R1", "S2"] });
        expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("enthält ohne Auswahl keine zusätzlichen Buttons (kein Mehr/Weniger, kein Reset)", () => {
        const { container } = renderFilter({ availableLines: ["R1", "S2"] });
        // Nur die beiden Linien-Toggles, sonst nichts.
        expect(container.querySelectorAll("button")).toHaveLength(2);
        expect(container.querySelectorAll("button:not([aria-pressed])")).toHaveLength(0);
    });

    it("fügt eine nicht ausgewählte Linie per Klick hinzu", () => {
        const { onAddLine } = renderFilter({ availableLines: ["R1", "S2"] });

        expect(lineButton("R1")?.getAttribute("aria-pressed")).toBe("false");
        fireEvent.click(screen.getByText("R1"));

        expect(onAddLine).toHaveBeenCalledExactlyOnceWith("R1");
    });

    it("entfernt eine ausgewählte Linie per Klick", () => {
        const { onRemoveLine } = renderFilter({
            availableLines: ["R1", "S2"],
            selectedLines: ["R1"]
        });

        expect(lineButton("R1")?.getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(screen.getByText("R1"));

        expect(onRemoveLine).toHaveBeenCalledExactlyOnceWith("R1");
    });

    it("zeigt eine ausgewählte, nicht mehr verfügbare Linie weiterhin abwählbar an (Union)", () => {
        const { onRemoveLine } = renderFilter({
            availableLines: ["R1"],
            selectedLines: ["S9"]
        });

        expect(screen.getByText("S9")).toBeInTheDocument();
        expect(lineButton("S9")?.getAttribute("aria-pressed")).toBe("true");

        fireEvent.click(screen.getByText("S9"));
        expect(onRemoveLine).toHaveBeenCalledExactlyOnceWith("S9");
    });

    it("zeigt den Reset-Button nur bei Auswahl und nutzt den Reset-Handler", () => {
        const { container, onReset } = renderFilter({
            availableLines: ["R1", "S2"],
            selectedLines: ["R1"]
        });

        const resetButton = container.querySelector("button:not([aria-pressed])");
        expect(resetButton).not.toBeNull();

        fireEvent.click(resetButton!);
        expect(onReset).toHaveBeenCalledOnce();
    });
});
