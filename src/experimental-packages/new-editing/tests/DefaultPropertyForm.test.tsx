// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";

import { Feature } from "ol";
import { Point } from "ol/geom";
import { useEffect, type ReactNode } from "react";

import { DefaultPropertyForm } from "../implementation/components/propertyeditor/DefaultPropertyForm";
import { PropertyFormContextProvider } from "../implementation/context/PropertyFormContextProvider";
import { usePropertyFormContext } from "../implementation/context/usePropertyFormContext";
import type { PropertyFormContext } from "../api/editor/context";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";
import type { CreationStep } from "../api/model/EditingStep";

describe("DefaultPropertyForm input types", () => {
    it("renders text-field input and updates property on typing", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Text Field");
        expect(label).toBeDefined();

        const input = screen.getByPlaceholderText("Text Field") as HTMLInputElement;
        expect(input).toBeDefined();
        expect(input.tagName).toBe("INPUT");
        expect((input as HTMLInputElement).type).toBe("text");

        await user.type(input, "Hello World");

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("textField")).toBe("Hello World");
        });
    });

    it("renders text-area input and updates property on typing", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Text Area");
        expect(label).toBeDefined();

        const textarea = screen.getByPlaceholderText("Text Area") as HTMLTextAreaElement;
        expect(textarea).toBeDefined();
        expect(textarea.tagName).toBe("TEXTAREA");

        await user.type(textarea, "Multi-line\ntext content");

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("textArea")).toBe("Multi-line\ntext content");
        });
    });

    it("renders number input and updates property on change", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Number Input");
        expect(label).toBeDefined();

        const input = screen.getByPlaceholderText("Number Input") as HTMLInputElement;
        expect(input).toBeDefined();

        await user.clear(input);
        await user.type(input, "42");

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("numberInput")).toBe(42);
        });
    });

    it("renders string radio group input and updates property on selection", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("String Radio Group");
        expect(label).toBeDefined();

        const radios = screen.getAllByRole("radio");
        expect(radios.length).toBeGreaterThan(0);

        const radioB = radios.find((radio) => {
            const label = radio.closest("label");
            return label?.textContent?.includes("Option B");
        });

        expect(radioB).toBeDefined();
        await user.click(radioB!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("stringRadioGroup")).toBe("b");
        });
    });

    it("renders number radio group input and updates property on selection", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Number Radio Group");
        expect(label).toBeDefined();

        const radios = screen.getAllByRole("radio");
        expect(radios.length).toBeGreaterThan(0);

        const radio2 = radios.find((radio) => {
            const label = radio.closest("label");
            return label?.textContent?.includes("Two");
        });

        expect(radio2).toBeDefined();
        await user.click(radio2!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("numberRadioGroup")).toBe(2);
        });
    });

    it("renders string combo box input and updates property on selection", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("String Combo Box");
        expect(label).toBeDefined();

        const comboBoxInputs = screen.getAllByRole("combobox");
        expect(comboBoxInputs.length).toBeGreaterThan(0);

        const stringComboBox = comboBoxInputs.find((input) => {
            const group = input.closest('[role="group"]');
            return group?.textContent?.includes("String Combo Box");
        });

        expect(stringComboBox).toBeDefined();

        // Type to filter options
        await user.type(stringComboBox!, "B");

        await waitFor(() => {
            const options = screen.queryAllByRole("option");
            expect(options.length).toBeGreaterThan(0);
        });

        const options = screen.getAllByRole("option");
        const optionB = options.find((opt) => opt.textContent?.includes("Option B"));
        expect(optionB).toBeDefined();
        await user.click(optionB!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("stringComboBox")).toBe("b");
        });
    });

    it("renders check-box input and updates property on click", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Check Box");
        expect(label).toBeDefined();

        const checkboxLabel = screen.getByText("Enable Feature");
        expect(checkboxLabel).toBeDefined();

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);

        const checkbox = checkboxes.find((cb) => {
            const label = cb.closest("label");
            return label?.textContent?.includes("Enable Feature");
        });

        expect(checkbox).toBeDefined();
        await user.click(checkbox!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("checkBox")).toBe(true);
        });

        // Click again to uncheck
        await user.click(checkbox!);

        await waitFor(() => {
            expect(context!.properties.get("checkBox")).toBe(false);
        });
    });

    it("renders color input and updates property on color change", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Color Input");
        expect(label).toBeDefined();

        // Find the color picker input (hex input field)
        const inputs = screen.getAllByRole("textbox");
        const colorInput = inputs.find(
            (input) =>
                input.getAttribute("placeholder")?.toLowerCase().includes("color") ||
                (input as HTMLInputElement).value?.match(/^#[0-9A-Fa-f]{6,8}$/)
        ) as HTMLInputElement;
        expect(colorInput).toBeDefined();

        // Verify initial value format (should be a hex color)
        expect(colorInput.value).toMatch(/^#[0-9A-Fa-f]{6,8}$/);

        // Change the color by typing a new hex value
        await user.clear(colorInput);
        await user.type(colorInput, "#FF5733");

        // Trigger blur to ensure the change is committed
        fireEvent.blur(colorInput);

        await waitFor(() => {
            expect(context).toBeDefined();
            const colorValue = context!.properties.get("colorInput");
            expect(colorValue).toBeDefined();
            expect(colorValue).toMatch(/^#[0-9A-Fa-f]{6,8}$/i);
        });

        // Verify the color trigger button exists
        const colorTriggers = screen.getAllByRole("button");
        const colorTrigger = colorTriggers.find(
            (btn) =>
                btn.getAttribute("aria-label")?.toLowerCase().includes("color") ||
                btn.closest('[role="group"]')?.querySelector('input[type="text"]') === colorInput
        );
        expect(colorTrigger).toBeDefined();
    });

    it("renders date input without time and updates property on change", async () => {
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Date Input");
        expect(label).toBeDefined();

        const inputs = screen.getAllByDisplayValue("");
        const dateInput = inputs.find(
            (input) => (input as HTMLInputElement).type === "date"
        ) as HTMLInputElement;
        expect(dateInput).toBeDefined();

        const testDate = "2026-12-25";
        fireEvent.change(dateInput, { target: { value: testDate } });

        await waitFor(() => {
            expect(context).toBeDefined();
            const dateValue = context!.properties.get("dateInput");
            expect(dateValue).toBe(testDate);
        });
    });

    it("renders date input with time and updates property on change", async () => {
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("DateTime Input");
        expect(label).toBeDefined();

        const inputs = screen.getAllByDisplayValue("");
        const dateTimeInput = inputs.find(
            (input) => (input as HTMLInputElement).type === "datetime-local"
        ) as HTMLInputElement;
        expect(dateTimeInput).toBeDefined();

        const testDateTime = "2026-12-25T14:30";
        fireEvent.change(dateTimeInput, { target: { value: testDateTime } });

        await waitFor(() => {
            expect(context).toBeDefined();
            const dateTimeValue = context!.properties.get("dateTimeInput");
            expect(dateTimeValue).toBe(testDateTime);
        });
    });

    it("renders string select input and updates property on selection", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("String Select");
        expect(label).toBeDefined();

        const selectTriggers = screen.getAllByRole("combobox");
        expect(selectTriggers.length).toBeGreaterThan(0);

        const placeholder = screen.getByText("Select an option");
        expect(placeholder).toBeDefined();

        const stringSelectTrigger = selectTriggers.find((trigger) => {
            const group = trigger.closest('[role="group"]');
            return group?.textContent?.includes("String Select");
        });
        expect(stringSelectTrigger).toBeDefined();
        await user.click(stringSelectTrigger!);

        await waitFor(() => {
            const options = screen.getAllByRole("option");
            expect(options.length).toBeGreaterThan(0);
        });

        const options = screen.getAllByRole("option");
        const optionB = options.find((opt) => opt.getAttribute("data-value") === "b");
        expect(optionB).toBeDefined();
        await user.click(optionB!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("stringSelect")).toBe("b");
        });
    });

    it("renders number select input and updates property on selection", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const labels = screen.getAllByText("Number Select");
        expect(labels.length).toBeGreaterThan(0);

        const selectTriggers = screen.getAllByRole("combobox");
        expect(selectTriggers.length).toBeGreaterThan(0);

        const numberSelectTrigger = selectTriggers.find((trigger) => {
            const group = trigger.closest('[role="group"]');
            return group?.textContent?.includes("Number Select");
        });
        expect(numberSelectTrigger).toBeDefined();
        await user.click(numberSelectTrigger!);

        await waitFor(() => {
            const options = screen.getAllByRole("option");
            expect(options.length).toBeGreaterThan(0);
        });

        const options = screen.getAllByRole("option");
        const optionTwo = options.find((opt) => opt.getAttribute("data-value") === "2");
        expect(optionTwo).toBeDefined();
        await user.click(optionTwo!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("numberSelect")).toBe(2);
        });
    });

    it("renders switch input and updates property on toggle", async () => {
        const user = userEvent.setup();
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Switch");
        expect(label).toBeDefined();

        const switchLabel = screen.getByText("Enable Notifications");
        expect(switchLabel).toBeDefined();

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);

        const switchInput = checkboxes.find((cb) => {
            const label = cb.closest("label");
            return label?.textContent?.includes("Enable Notifications");
        });

        expect(switchInput).toBeDefined();
        await user.click(switchInput!);

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("switch")).toBe(true);
        });

        // Click again to toggle off
        await user.click(switchInput!);

        await waitFor(() => {
            expect(context!.properties.get("switch")).toBe(false);
        });
    });

    it("renders custom slider input and updates property on change", async () => {
        const editingStep = createTestEditingStep();
        let context: PropertyFormContext | undefined;

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Custom Input");
        expect(label).toBeDefined();

        // Find the slider by its data-testid
        const slider = screen.getByTestId("custom-slider") as HTMLInputElement;
        expect(slider).toBeDefined();
        expect(slider.type).toBe("range");
        expect(slider.value).toBe("50"); // Default value

        // Verify initial state
        expect(context).toBeDefined();

        // Change the slider value
        const newValue = 75;
        fireEvent.change(slider, { target: { value: newValue.toString() } });

        await waitFor(() => {
            const updatedValue = context!.properties.get("customInput");
            expect(updatedValue).toBe(newValue);
        });
    });

    it("renders all field inputs at once", async () => {
        const editingStep = createTestEditingStep();

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="All Fields"
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        expect(screen.getByText("Text Field")).toBeDefined();
        expect(screen.getByText("Text Area")).toBeDefined();
        expect(screen.getByText("Number Input")).toBeDefined();
        expect(screen.getByText("Check Box")).toBeDefined();
        expect(screen.getByText("Color Input")).toBeDefined();
        expect(screen.getByText("Date Input")).toBeDefined();
        expect(screen.getByText("DateTime Input")).toBeDefined();
        expect(screen.getByText("String Select")).toBeDefined();
        expect(screen.getAllByText("Number Select").length).toBeGreaterThan(0);
        expect(screen.getByText("Custom Input")).toBeDefined();
    });

    it("renders form title", async () => {
        const editingStep = createTestEditingStep();
        const customTitle = "My Custom Property Form";

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title={customTitle}
                        templates={[allInputTypesTemplate]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const title = screen.getByText(customTitle);
        expect(title).toBeDefined();
    });
});

// Test helper component to capture context
function ContextCapture({ onCapture }: { onCapture: (ctx: PropertyFormContext) => void }): null {
    const context = usePropertyFormContext();
    useEffect(() => {
        onCapture(context);
    }, [context, onCapture]);
    return null;
}

// Define one field input for each input type
const allInputTypesTemplate: FeatureTemplate = {
    kind: "declarative",
    name: "All Input Types",
    geometryType: "Point",
    fields: [
        {
            type: "text-field",
            propertyName: "textField",
            label: "Text Field"
        },
        {
            type: "text-area",
            propertyName: "textArea",
            label: "Text Area"
        },
        {
            type: "number-field",
            propertyName: "numberInput",
            label: "Number Input",
            min: 0,
            max: 100
        },
        {
            type: "check-box",
            propertyName: "checkBox",
            label: "Check Box",
            checkBoxLabel: "Enable Feature"
        },
        {
            type: "combo-box",
            valueType: "string",
            propertyName: "stringComboBox",
            label: "String Combo Box",
            placeholder: "Type or select...",
            options: [
                { label: "Option A", value: "a" },
                { label: "Option B", value: "b" },
                { label: "Option C", value: "c" }
            ]
        },
        {
            type: "switch",
            propertyName: "switch",
            label: "Switch",
            switchLabel: "Enable Notifications"
        },
        {
            type: "color-picker",
            propertyName: "colorInput",
            label: "Color Input",
            swatchColors: ["#FF0000", "#00FF00", "#0000FF"]
        },
        {
            type: "date-picker",
            propertyName: "dateInput",
            label: "Date Input",
            includeTime: false
        },
        {
            type: "date-picker",
            propertyName: "dateTimeInput",
            label: "DateTime Input",
            includeTime: true
        },
        {
            type: "radio-group",
            valueType: "string",
            propertyName: "stringRadioGroup",
            label: "String Radio Group",
            options: [
                { label: "Option A", value: "a" },
                { label: "Option B", value: "b" },
                { label: "Option C", value: "c" }
            ]
        },
        {
            type: "radio-group",
            valueType: "number",
            propertyName: "numberRadioGroup",
            label: "Number Radio Group",
            options: [
                { label: "One", value: 1 },
                { label: "Two", value: 2 },
                { label: "Three", value: 3 }
            ]
        },
        {
            type: "select",
            valueType: "string",
            propertyName: "stringSelect",
            label: "String Select",
            placeholder: "Select an option",
            options: [
                { label: "Option A", value: "a" },
                { label: "Option B", value: "b" }
            ]
        },
        {
            type: "select",
            valueType: "number",
            propertyName: "numberSelect",
            label: "Number Select",
            options: [
                { label: "One", value: 1 },
                { label: "Two", value: 2 }
            ]
        },
        {
            type: "custom",
            propertyName: "customInput",
            label: "Custom Input",
            render: (value, onChange): ReactNode => (
                <input
                    data-testid="custom-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={typeof value === "number" ? value : 50}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            )
        }
    ]
};

function createTestEditingStep(): CreationStep {
    const feature = new Feature({
        geometry: new Point([0, 0])
    });

    return {
        id: "create-modify",
        feature,
        template: allInputTypesTemplate,
        drawOlLayer: {} as any // Mock OL layer
    };
}
