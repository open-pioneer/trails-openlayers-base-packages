// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerFactory } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import type { NotificationService } from "@open-pioneer/notifier";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";
import type { FeatureWriter } from "../api/model/FeatureWriter";
import { FeatureEditor } from "./FeatureEditor";

const mockWriter: FeatureWriter = {
    addFeature: vi.fn().mockResolvedValue(undefined),
    updateFeature: vi.fn().mockResolvedValue(undefined),
    deleteFeature: vi.fn().mockResolvedValue(undefined)
};

const pointTemplate: FeatureTemplate = {
    kind: "declarative",
    name: "Point Feature",
    geometryType: "Point",
    fields: []
};

const lineStringTemplate: FeatureTemplate = {
    kind: "declarative",
    name: "LineString Feature",
    geometryType: "LineString",
    fields: []
};

const polygonTemplate: FeatureTemplate = {
    kind: "declarative",
    name: "Polygon Feature",
    geometryType: "Polygon",
    fields: []
};

const circleTemplate: FeatureTemplate = {
    kind: "declarative",
    name: "Circle Feature",
    geometryType: "Circle",
    fields: []
};

const allTemplates: FeatureTemplate[] = [
    pointTemplate,
    lineStringTemplate,
    polygonTemplate,
    circleTemplate
];

describe("Editor rendering", () => {
    it("renders all geometry type templates with correct names", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor map={map} templates={allTemplates} writer={mockWriter} />
            </PackageContextProvider>
        );

        await waitFor(() => {
            const pointElement = screen.getByText("Point Feature");
            const lineStringElement = screen.getByText("LineString Feature");
            const polygonElement = screen.getByText("Polygon Feature");
            const circleElement = screen.getByText("Circle Feature");

            expect(pointElement).toBeInTheDocument();
            expect(lineStringElement).toBeInTheDocument();
            expect(polygonElement).toBeInTheDocument();
            expect(circleElement).toBeInTheDocument();
        });
    });

    it("handles empty templates array", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor map={map} templates={[]} writer={mockWriter} />
            </PackageContextProvider>
        );

        // Should still render select button
        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: /actionSelector.selectButtonTitle/i })
            ).toBeInTheDocument();
        });
    });
});

describe("Editor interaction", () => {
    it("changes editing step when selecting template", async () => {
        const user = userEvent.setup();
        const { map, layerFactory } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={allTemplates}
                    writer={mockWriter}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        const template = await screen.findByText("Point Feature");
        await user.click(template);

        await waitFor(() => {
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "drawing",
                    template: pointTemplate
                })
            );
        });
    });

    it("changes editing step when clicking the select button", async () => {
        const user = userEvent.setup();
        const { map, layerFactory } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={allTemplates}
                    writer={mockWriter}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        // Initial step should be "none"
        expect(onEditingStepChange).toHaveBeenCalledWith({ id: "initial" });

        // Find and click the select button
        const selectButton = await screen.findByRole("button", {
            name: /actionSelector\.selectButtonTitle/i
        });
        await user.click(selectButton);
        await waitFor(() => {
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({ id: "selection" })
            );
        });
    });

    it("toggles select button state when clicked", async () => {
        const user = userEvent.setup();
        const { map, layerFactory } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={allTemplates}
                    writer={mockWriter}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        const selectButton = await screen.findByRole("button", {
            name: /actionSelector\.selectButtonTitle/i
        });

        // Click to activate
        await user.click(selectButton);

        await waitFor(() => {
            // Should change to update-select step
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({ id: "selection" })
            );
        });

        // Click again to deactivate
        await user.click(selectButton);

        await waitFor(() => {
            // Should go back to initial step
            const calls = onEditingStepChange.mock.calls;
            const lastCall = calls[calls.length - 1]?.[0];
            expect(lastCall).toEqual({ id: "initial" });
        });
    });
});

describe("Editor action bar buttons", () => {
    const forEachActionButton = (action: (button: HTMLElement | null) => void) => {
        const ariaLabels = [
            "actionSelector.finishButtonTooltip",
            "actionSelector.resetButtonTooltip",
            "actionSelector.undoButtonTooltip",
            "actionSelector.redoButtonTooltip"
        ];
        for (const ariaLabel of ariaLabels) {
            const button = screen.queryByLabelText(ariaLabel);
            action(button);
        }
    };

    it("renders action bar with all buttons for polygon geometry", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={[polygonTemplate]}
                    writer={mockWriter}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find polygon template and click it to show action bar
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        await waitFor(() => {
            forEachActionButton((button) => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    it("renders action bar with all buttons for linestring geometry", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={[lineStringTemplate]}
                    writer={mockWriter}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find linestring template and click it to show action bar
        const lineButton = await screen.findByText("LineString Feature");
        await userEvent.click(lineButton);

        await waitFor(() => {
            forEachActionButton((button) => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    it("does not render action bar for point geometry", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={[pointTemplate]}
                    writer={mockWriter}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find point template and click it
        const pointButton = await screen.findByText("Point Feature");
        await userEvent.click(pointButton);

        // Action bar should not be present for Point geometry
        await waitFor(() => {
            forEachActionButton((button) => {
                expect(button).not.toBeInTheDocument();
            });
        });
    });

    it("does not render action bar when showActionBar is false", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={[polygonTemplate]}
                    writer={mockWriter}
                    showActionBar={false}
                />
            </PackageContextProvider>
        );

        // Find polygon template and click it
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        // Action bar should not be present
        await waitFor(() => {
            forEachActionButton((button) => {
                expect(button).not.toBeInTheDocument();
            });
        });
    });

    it("has disabled buttons initially in action bar", async () => {
        const { map, layerFactory } = await setupMap();

        render(
            <PackageContextProvider services={createInjectedServices(layerFactory)}>
                <FeatureEditor
                    map={map}
                    templates={[polygonTemplate]}
                    writer={mockWriter}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Click polygon template to show action bar
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        // Initially, all buttons should be disabled (no geometry drawn yet)
        await waitFor(() => {
            forEachActionButton((button) => {
                expect(button).toBeDisabled();
            });
        });
    });
});

function createInjectedServices(layerFactory: LayerFactory) {
    return {
        "notifier.NotificationService": {
            notify() {},
            success() {},
            error() {},
            info() {},
            warning() {},
            closeAll() {}
        } satisfies NotificationService,
        "map.LayerFactory": layerFactory
    };
}
