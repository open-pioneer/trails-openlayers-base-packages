// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import type { NotificationService } from "@open-pioneer/notifier";

import { Editor } from "../implementation/Editor";
import type { EditingHandler } from "../api/model/EditingHandler";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";

const mockEditingHandler: EditingHandler = {
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

const injectedServices = {
    "notifier.NotificationService": {
        notify() {},
        success() {},
        error() {},
        info() {},
        warning() {},
        closeAll() {}
    } satisfies NotificationService
};

describe("Editor rendering", () => {
    it("renders all geometry type templates with correct names", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor map={map} templates={allTemplates} editingHandler={mockEditingHandler} />
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
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor map={map} templates={[]} editingHandler={mockEditingHandler} />
            </PackageContextProvider>
        );

        // Should still render select button
        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: /actionSelector.selectButtonTitle/i })
            ).toBeInTheDocument();
        });
    });

    it("renders custom title correctly", async () => {
        const { map } = await setupMap();
        const customTitle = "My Custom Editor";

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={allTemplates}
                    editingHandler={mockEditingHandler}
                    title={customTitle}
                />
            </PackageContextProvider>
        );

        await waitFor(() => {
            const titleElement = screen.getByText(customTitle);
            expect(titleElement).toBeInTheDocument();
        });
    });

    it("renders default title when no title is provided", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor map={map} templates={allTemplates} editingHandler={mockEditingHandler} />
            </PackageContextProvider>
        );

        await waitFor(() => {
            // Default title is a translation key
            const defaultTitleElement = screen.getByText("header.defaultTitle");
            expect(defaultTitleElement).toBeInTheDocument();
        });
    });
});

describe("Editor interaction", () => {
    it("changes editing step when selecting template", async () => {
        const user = userEvent.setup();
        const { map } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={allTemplates}
                    editingHandler={mockEditingHandler}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        const template = await screen.findByText("Point Feature");
        await user.click(template);

        await waitFor(() => {
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "create-draw",
                    template: pointTemplate
                })
            );
        });
    });

    it("changes editing step when clicking the select button", async () => {
        const user = userEvent.setup();
        const { map } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={allTemplates}
                    editingHandler={mockEditingHandler}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        // Initial step should be "none"
        expect(onEditingStepChange).toHaveBeenCalledWith({ id: "none" });

        // Find and click the select button
        const selectButton = await screen.findByRole("button", {
            name: /actionSelector.selectButtonTitle/i
        });
        await user.click(selectButton);

        // Should change to update-select step
        await waitFor(() => {
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({ id: "update-select" })
            );
        });
    });

    it("toggles select button state when clicked", async () => {
        const user = userEvent.setup();
        const { map } = await setupMap();
        const onEditingStepChange = vi.fn();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={allTemplates}
                    editingHandler={mockEditingHandler}
                    onEditingStepChange={onEditingStepChange}
                />
            </PackageContextProvider>
        );

        const selectButton = await screen.findByRole("button", {
            name: /actionSelector.selectButtonTitle/i
        });

        // Click to activate
        await user.click(selectButton);

        await waitFor(() => {
            // Should change to update-select step
            expect(onEditingStepChange).toHaveBeenCalledWith(
                expect.objectContaining({ id: "update-select" })
            );
        });

        // Click again to deactivate
        await user.click(selectButton);

        await waitFor(() => {
            // Should go back to none step
            const calls = onEditingStepChange.mock.calls;
            const lastCall = calls[calls.length - 1]?.[0];
            expect(lastCall).toEqual({ id: "none" });
        });
    });
});

describe("Editor action bar buttons", () => {
    const queryActionButtons = (action: (button: HTMLElement | null) => void) => {
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
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={[polygonTemplate]}
                    editingHandler={mockEditingHandler}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find polygon template and click it to show action bar
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        await waitFor(() => {
            queryActionButtons((button) => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    it("renders action bar with all buttons for linestring geometry", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={[lineStringTemplate]}
                    editingHandler={mockEditingHandler}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find linestring template and click it to show action bar
        const lineButton = await screen.findByText("LineString Feature");
        await userEvent.click(lineButton);

        await waitFor(() => {
            queryActionButtons((button) => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    it("does not render action bar for point geometry", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={[pointTemplate]}
                    editingHandler={mockEditingHandler}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Find point template and click it
        const pointButton = await screen.findByText("Point Feature");
        await userEvent.click(pointButton);

        // Action bar should not be present for Point geometry
        await waitFor(() => {
            queryActionButtons((button) => {
                expect(button).not.toBeInTheDocument();
            });
        });
    });

    it("does not render action bar when showActionBar is false", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={[polygonTemplate]}
                    editingHandler={mockEditingHandler}
                    showActionBar={false}
                />
            </PackageContextProvider>
        );

        // Find polygon template and click it
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        // Action bar should not be present
        await waitFor(() => {
            queryActionButtons((button) => {
                expect(button).not.toBeInTheDocument();
            });
        });
    });

    it("has disabled buttons initially in action bar", async () => {
        const { map } = await setupMap();

        render(
            <PackageContextProvider services={injectedServices}>
                <Editor
                    map={map}
                    templates={[polygonTemplate]}
                    editingHandler={mockEditingHandler}
                    showActionBar={true}
                />
            </PackageContextProvider>
        );

        // Click polygon template to show action bar
        const polygonButton = await screen.findByText("Polygon Feature");
        await userEvent.click(polygonButton);

        // Initially, all buttons should be disabled (no geometry drawn yet)
        await waitFor(() => {
            queryActionButtons((button) => {
                expect(button).toBeDisabled();
            });
        });
    });
});
