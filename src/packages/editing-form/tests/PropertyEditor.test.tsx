// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { PropertyEditor } from "../implementation/components/propertyeditor/PropertyEditor";
import { DefaultPropertyForm } from "../implementation/components/propertyeditor/DefaultPropertyForm";
import { PropertyFormContextProvider } from "../implementation/context/PropertyFormContextProvider";
import { Feature } from "ol";
import { Point } from "ol/geom";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";
import type { Layer } from "@open-pioneer/map";
import type { ModificationStep } from "../api/model/EditingStep";

describe("PropertyEditor Integration", () => {
    const createTemplate = (): FeatureTemplate => ({
        name: "Test Template",
        kind: "declarative",
        geometryType: "Point",
        fields: [
            {
                type: "text-field",
                label: "Name",
                propertyName: "name",
                isRequired: true
            },
            {
                type: "text-area",
                label: "Description",
                propertyName: "description"
            }
        ]
    });

    describe("create mode workflow", () => {
        it("renders property form for creating a feature", () => {
            const template = createTemplate();
            const feature = new Feature();
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "create-modify",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={vi.fn()} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Should render form - property editor renders but form may be empty without template
            const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
            const cancelButton = screen.getByRole("button", { name: /cancelButtonTitle/i });

            expect(saveButton).toBeInTheDocument();
            expect(cancelButton).toBeInTheDocument();

            // Should not have delete button in create mode
            expect(screen.queryByLabelText(/deleteButtonTooltip/i)).not.toBeInTheDocument();
        });

        it("save button is disabled initially due to required field", () => {
            const template = createTemplate();
            const feature = new Feature();
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "create-modify",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={vi.fn()} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
            expect(saveButton).toBeDisabled();
        });

        it("allows filling in form and saving", async () => {
            const user = userEvent.setup();
            const template = createTemplate();
            const feature = new Feature();
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "create-modify",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={vi.fn()} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Fill in required field
            const nameInput = screen.getByLabelText(/name/i);
            await user.type(nameInput, "Test Feature");

            // Fill in optional field
            const descriptionInput = screen.getByLabelText(/description/i);
            await user.type(descriptionInput, "A test description");

            // Wait for save button to be enabled
            await waitFor(() => {
                const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
                expect(saveButton).not.toBeDisabled();
            });

            // Click save
            const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
            await user.click(saveButton);

            expect(onSave).toHaveBeenCalledOnce();
        });

        it("allows canceling without saving", async () => {
            const user = userEvent.setup();
            const template = createTemplate();
            const feature = new Feature();
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "create-modify",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={vi.fn()} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            const cancelButton = screen.getByRole("button", { name: /cancelButtonTitle/i });
            await user.click(cancelButton);

            expect(onCancel).toHaveBeenCalledOnce();
            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe("update mode workflow", () => {
        it("renders property form for updating a feature", () => {
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Existing Feature",
                description: "Existing description"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Should have delete button in update mode
            expect(screen.getByLabelText(/deleteButtonTooltip/i)).toBeInTheDocument();
        });

        it("pre-fills form with existing feature properties", () => {
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Existing Feature",
                description: "Existing description"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
            const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

            expect(nameInput.value).toBe("Existing Feature");
            expect(descriptionInput.value).toBe("Existing description");
        });

        it("allows updating and saving feature", async () => {
            const user = userEvent.setup();
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Old Name",
                description: "Old description"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Update name
            const nameInput = screen.getByLabelText(/name/i);
            await user.clear(nameInput);
            await user.type(nameInput, "Updated Name");

            // Save
            const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
            await user.click(saveButton);

            expect(onSave).toHaveBeenCalledOnce();
        });

        it("shows delete confirmation dialog", async () => {
            const user = userEvent.setup();
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Feature to Delete"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Click delete button
            const deleteButton = screen.getByLabelText(/deleteButtonTooltip/i);
            await user.click(deleteButton);

            // Confirmation dialog should appear
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            expect(onDelete).not.toHaveBeenCalled();
        });

        it("confirms and deletes feature", async () => {
            const user = userEvent.setup();
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Feature to Delete"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Click delete button
            const deleteButton = screen.getByLabelText(/deleteButtonTooltip/i);
            await user.click(deleteButton);

            // Wait for dialog and confirm
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            const confirmButton = screen.getByRole("button", { name: /deleteButtonTitle/i });
            await user.click(confirmButton);

            expect(onDelete).toHaveBeenCalledOnce();
        });

        it("cancels delete operation", async () => {
            const user = userEvent.setup();
            const layer = { id: "test-layer" } as Layer;
            const feature = new Feature({
                name: "Feature to Delete"
            });
            feature.setGeometry(new Point([10, 20]));

            const step: ModificationStep = {
                id: "update-modify",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[{ ...template, layerId: "test-layer" }]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Click delete button
            const deleteButton = screen.getByLabelText(/deleteButtonTooltip/i);
            await user.click(deleteButton);

            // Wait for dialog and cancel
            await waitFor(() => {
                expect(screen.getByRole("alertdialog")).toBeInTheDocument();
            });

            const cancelDialogButton = screen.getByRole("button", { name: /cancelButtonTitle/i });
            await user.click(cancelDialogButton);

            expect(onDelete).not.toHaveBeenCalled();

            // Dialog should close
            await waitFor(() => {
                expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
            });
        });
    });

    describe("validation", () => {
        it("validates required fields", async () => {
            const user = userEvent.setup();
            const template = createTemplate();
            const feature = new Feature({ name: "Initial Name" });
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "create-modify",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider editingStep={step}>
                        <PropertyEditor onSave={onSave} onDelete={vi.fn()} onCancel={onCancel}>
                            <DefaultPropertyForm
                                title=""
                                templates={[]}
                                formTemplateProvider={undefined}
                            />
                        </PropertyEditor>
                    </PropertyFormContextProvider>
                </PackageContextProvider>
            );

            // Initially valid (has name)
            await waitFor(() => {
                const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
                expect(saveButton).not.toBeDisabled();
            });

            // Clear required field
            const nameInput = screen.getByLabelText(/name/i);
            await user.clear(nameInput);

            // Should become invalid
            await waitFor(() => {
                const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
                expect(saveButton).toBeDisabled();
            });
        });
    });
});
