// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { describe, expect, it, vi } from "vitest";
import { FormTemplateContext } from "../../../api/editor/editor";
import type { ModificationStep } from "../../../api/model/EditingStep";
import type { FeatureTemplate, FormTemplate } from "../../../api/model/FeatureTemplate";
import { PropertyFormContextProvider } from "../../context/PropertyFormContextProvider";
import { EditingCallbacks } from "../../editor/useEditingCallbacks";
import { PropertyEditor } from "./PropertyEditor";
import { PropertyForm } from "./PropertyForm";

describe("create mode workflow", () => {
    it("renders property form for creating a feature", () => {
        const template = createTemplate();
        const feature = new Feature();
        feature.setGeometry(new Point([0, 0]));

        const step: ModificationStep = {
            id: "creation",
            drawLayer: {} as any,
            template,
            feature
        };
        const onSave = vi.fn();
        const onCancel = vi.fn();
        renderEditor({ step, callbacks: { onSave, onCancel } });

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
            drawLayer: {} as any,
            template,
            feature
        };
        const onSave = vi.fn();
        const onCancel = vi.fn();
        renderEditor({ step, callbacks: { onSave, onCancel } });

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
            drawLayer: {} as any,
            template,
            feature
        };
        const onSave = vi.fn();
        const onCancel = vi.fn();
        renderEditor({ step, callbacks: { onSave, onCancel } });

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
            drawLayer: {} as any,
            template,
            feature
        };
        const onSave = vi.fn();
        const onCancel = vi.fn();
        renderEditor({ step, callbacks: { onSave, onCancel } });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
        renderEditor({
            step,
            callbacks: { onSave, onDelete, onCancel },
            templates: [{ ...template, layerId: "test-layer" }]
        });

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
            drawLayer: {} as any,
            template,
            feature
        };
        renderEditor({ step });

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

    it("shows custom error texts", async () => {
        const template = createTemplate();
        const feature = new Feature({ name: "invalid-value" });
        feature.setGeometry(new Point([0, 0]));

        const step: ModificationStep = {
            id: "creation",
            drawLayer: {} as any,
            template,
            feature
        };
        renderEditor({ step });

        // Save button must be disabled because the value is not valid
        await waitFor(() => {
            const saveButton = screen.getByRole("button", { name: /saveButtonTitle/i });
            expect(saveButton).toBeDisabled();
        });

        // There should be an error message linked to the input field via aria-describedby
        expect(
            screen.getByRole("textbox", { name: /name/i, description: /custom error text/i })
        ).toBeInTheDocument();
    });
});

function renderEditor(options: {
    step: ModificationStep;
    callbacks?: Partial<EditingCallbacks>;
    templates?: FeatureTemplate[];
    resolveFormTemplate?: (context: FormTemplateContext) => FormTemplate | undefined;
}) {
    const { step, callbacks, templates = [], resolveFormTemplate } = options;
    return render(
        <PackageContextProvider>
            <PropertyFormContextProvider editingStep={step} callbacks={createCallbacks(callbacks)}>
                <PropertyEditor>
                    <PropertyForm templates={templates} resolveFormTemplate={resolveFormTemplate} />
                </PropertyEditor>
            </PropertyFormContextProvider>
        </PackageContextProvider>
    );
}

function createTemplate(): FeatureTemplate {
    return {
        name: "Test Template",
        kind: "declarative",
        geometryType: "Point",
        fields: [
            {
                type: "text-field",
                label: "Name",
                propertyName: "name",
                isRequired: true,
                errorText: "custom error text",
                isValid: (props) => props["name"] !== "invalid-value"
            },
            {
                type: "text-area",
                label: "Description",
                propertyName: "description"
            }
        ]
    };
}

function createCallbacks(opts?: Partial<EditingCallbacks>): EditingCallbacks {
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
}
