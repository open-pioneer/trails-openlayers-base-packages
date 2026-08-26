// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LayerDrawer } from "./LayerDrawer";

const EXPAND_LABEL = "Live-Bus-Filter öffnen";
const COLLAPSE_LABEL = "Live-Bus-Filter schließen";

function renderDrawer(isOpen: boolean) {
    const onToggle = vi.fn();
    render(
        <PackageContextProvider>
            <LayerDrawer
                panelId="layer-panel"
                isOpen={isOpen}
                title="Live-Busse Münster"
                expandLabel={EXPAND_LABEL}
                collapseLabel={COLLAPSE_LABEL}
                onToggle={onToggle}
            >
                <div>PANEL_CONTENT</div>
            </LayerDrawer>
        </PackageContextProvider>
    );
    return { onToggle };
}

describe("LayerDrawer", () => {
    it("zeigt im geschlossenen Zustand nur den Öffnen-Toggle und blendet den Inhalt aus", () => {
        renderDrawer(false);

        const toggle = screen.getByRole("button", { name: EXPAND_LABEL });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(toggle).toHaveAttribute("aria-controls", "layer-panel");
        expect(screen.queryByText("PANEL_CONTENT")).toBeNull();
        // Geschlossen: kein interner Schließen-Chevron.
        expect(screen.queryByRole("button", { name: COLLAPSE_LABEL })).toBeNull();
    });

    it("zeigt im offenen Zustand den internen Schließen-Chevron und rendert den Inhalt", () => {
        renderDrawer(true);

        const toggle = screen.getByRole("button", { name: COLLAPSE_LABEL });
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(toggle).toHaveAttribute("aria-controls", "layer-panel");
        expect(screen.getByText("PANEL_CONTENT")).toBeInTheDocument();
        // Geöffnet: kein externer Öffnen-Button.
        expect(screen.queryByRole("button", { name: EXPAND_LABEL })).toBeNull();
    });

    it("löst beim Klick auf den Öffnen-Toggle den Handler aus", () => {
        const { onToggle } = renderDrawer(false);

        fireEvent.click(screen.getByRole("button", { name: EXPAND_LABEL }));
        expect(onToggle).toHaveBeenCalledOnce();
    });

    it("löst beim Klick auf den internen Schließen-Chevron den Handler aus", () => {
        const { onToggle } = renderDrawer(true);

        fireEvent.click(screen.getByRole("button", { name: COLLAPSE_LABEL }));
        expect(onToggle).toHaveBeenCalledOnce();
    });
});
