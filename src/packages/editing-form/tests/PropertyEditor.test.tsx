// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { describe, expect, it, vi } from "vitest";
import type { ModificationStep } from "../api/model/EditingStep";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";
import { PropertyEditor } from "../implementation/components/property-editor/PropertyEditor";
import { PropertyForm } from "../implementation/components/property-editor/PropertyForm";
import { PropertyFormContextProvider } from "../implementation/context/PropertyFormContextProvider";
import { EditingCallbacks } from "../implementation/editor/useEditingCallbacks";

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

    const createCallbacks = (opts?: Partial<EditingCallbacks>): EditingCallbacks => {
        const DUMMY_CALLBACKS: EditingCallbacks = {
            onSave: () => {
                throw new Error("not implemented");
            },
            onDelete: () => {
                throw new Error("not implemented");
            },
            onCancel: () => {
                throw new Error("not implemented");
            }
        };
        return {
            ...DUMMY_CALLBACKS,
            ...opts
        };
    };

    describe("create mode workflow", () => {
        it("renders property form for creating a feature", () => {
            const template = createTemplate();
            const feature = new Feature();
            feature.setGeometry(new Point([0, 0]));

            const step: ModificationStep = {
                id: "creation",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm templates={[]} resolveFormTemplate={undefined} />
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
                id: "creation",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm templates={[]} resolveFormTemplate={undefined} />
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
                id: "creation",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm templates={[]} resolveFormTemplate={undefined} />
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
                id: "creation",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm templates={[]} resolveFormTemplate={undefined} />
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "update",
                layer,
                feature
            };

            const onSave = vi.fn();
            const onDelete = vi.fn();
            const onCancel = vi.fn();

            const template = createTemplate();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onDelete, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm
                                templates={[{ ...template, layerId: "test-layer" }]}
                                resolveFormTemplate={undefined}
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
                id: "creation",
                drawOlLayer: {} as any,
                template,
                feature
            };

            const onSave = vi.fn();
            const onCancel = vi.fn();

            render(
                <PackageContextProvider>
                    <PropertyFormContextProvider
                        editingStep={step}
                        callbacks={createCallbacks({ onSave, onCancel })}
                    >
                        <PropertyEditor>
                            <PropertyForm templates={[]} resolveFormTemplate={undefined} />
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
