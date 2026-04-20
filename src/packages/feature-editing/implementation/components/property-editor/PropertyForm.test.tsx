// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { useEffect, type ReactNode } from "react";
import { disableReactActWarnings } from "test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import type { PropertyFormContext } from "../../../api/editor/context";
import type { CreationStep, ModificationStep } from "../../../api/model/EditingStep";
import type { FeatureTemplate } from "../../../api/model/FeatureTemplate";
import { PropertyFormContextProvider } from "../../context/PropertyFormContextProvider";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { EditingCallbacks } from "../../editor/useEditingCallbacks";
import { PropertyForm } from "./PropertyForm";

beforeEach(() => {
    disableReactActWarnings();
});

describe("rendering", () => {
    it("renders text-field input and updates property on typing", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

        const label = screen.getByText("Text Field");
        expect(label).toBeDefined();

        const input = screen.getByPlaceholderText("Text Field") as HTMLInputElement;
        expect(input).toBeDefined();
        expect(input.tagName).toBe("INPUT");
        expect((input as HTMLInputElement).type).toBe("text");

        await user.type(input, "Hello World");
        await waitFor(() => {
            expect(getContext()?.properties.get("textField")).toBe("Hello World");
        });
    });

    it("renders text-area input and updates property on typing", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

        const label = screen.getByText("Text Area");
        expect(label).toBeDefined();

        const textarea = screen.getByPlaceholderText("Text Area") as HTMLTextAreaElement;
        expect(textarea).toBeDefined();
        expect(textarea.tagName).toBe("TEXTAREA");

        await user.type(textarea, "Multi-line\ntext content");
        await waitFor(() => {
            expect(getContext()?.properties.get("textArea")).toBe("Multi-line\ntext content");
        });
    });

    it("renders number input and updates property on change", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

        const label = screen.getByText("Number Input");
        expect(label).toBeDefined();

        const input = screen.getByPlaceholderText("Number Input") as HTMLInputElement;
        expect(input).toBeDefined();

        await user.clear(input);
        await user.type(input, "42");
        await waitFor(() => {
            expect(getContext()?.properties.get("numberInput")).toBe(42);
        });
    });

    it("renders string radio group input and updates property on selection", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("stringRadioGroup")).toBe("b");
        });
    });

    it("renders number radio group input and updates property on selection", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("numberRadioGroup")).toBe(2);
        });
    });

    it("renders string combo box input and updates property on selection", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("stringComboBox")).toBe("b");
        });
    });

    it("renders check-box input and updates property on click", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("checkBox")).toBe(true);
        });

        // Click again to uncheck
        await user.click(checkbox!);
        await waitFor(() => {
            expect(getContext()?.properties.get("checkBox")).toBe(false);
        });
    });

    it("renders color input and updates property on color change", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            const colorValue = getContext()?.properties.get("colorInput");
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
        const { getContext } = renderForm();

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
            const dateValue = getContext()?.properties.get("dateInput");
            expect(dateValue).toBe(testDate);
        });
    });

    it("renders date input with time and updates property on change", async () => {
        const { getContext } = renderForm();

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
            const dateTimeValue = getContext()?.properties.get("dateTimeInput");
            expect(dateTimeValue).toBe(testDateTime);
        });
    });

    it("renders string select input and updates property on selection", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("stringSelect")).toBe("b");
        });
    });

    it("renders number select input and updates property on selection", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("numberSelect")).toBe(2);
        });
    });

    it("renders switch input and updates property on toggle", async () => {
        const user = userEvent.setup();
        const { getContext } = renderForm();

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
            expect(getContext()?.properties.get("switch")).toBe(true);
        });

        // Click again to toggle off
        await user.click(switchInput!);

        await waitFor(() => {
            expect(getContext()?.properties.get("switch")).toBe(false);
        });
    });

    it("renders custom slider input and updates property on change", async () => {
        const { getContext } = renderForm();

        const label = screen.getByText("Custom Input");
        expect(label).toBeDefined();

        // Find the slider by its data-testid
        const slider = screen.getByTestId("custom-slider") as HTMLInputElement;
        expect(slider).toBeDefined();
        expect(slider.type).toBe("range");
        expect(slider.value).toBe("50"); // Default value

        // Verify initial state
        expect(getContext()).toBeDefined();

        // Change the slider value
        const newValue = 75;
        fireEvent.change(slider, { target: { value: newValue.toString() } });

        await waitFor(() => {
            const updatedValue = getContext()?.properties.get("customInput");
            expect(updatedValue).toBe(newValue);
        });
    });

    it("renders all field inputs at once", async () => {
        renderForm();

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
        renderForm();
        const title = screen.getByText("All Input Types");
        expect(title).toBeDefined();
    });
});

describe("property functions", () => {
    it("isRequired static value marks field as required", async () => {
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Required Field Test",
            geometryType: "Point",
            fields: [
                {
                    type: "text-field",
                    propertyName: "requiredField",
                    label: "Required Field",
                    isRequired: true
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        const label = screen.getByText("Required Field");
        const asterisk = label.querySelector(".chakra-field__requiredIndicator");
        expect(asterisk?.textContent).toBe("*");

        const input = screen.getByPlaceholderText("Required Field") as HTMLInputElement;
        expect(input.required).toBe(true);
    });

    it("isRequired function marks field as required based on other properties", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Conditional Required Test",
            geometryType: "Point",
            fields: [
                {
                    type: "check-box",
                    propertyName: "enableRequired",
                    label: "Enable Required",
                    checkBoxLabel: "Make name required"
                },
                {
                    type: "text-field",
                    propertyName: "name",
                    label: "Name",
                    isRequired: (properties) => properties.enableRequired === true
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        const nameInput = screen.getByPlaceholderText("Name") as HTMLInputElement;
        expect(nameInput.required).toBe(false);

        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);
        await waitFor(() => {
            expect(nameInput.required).toBe(true);
        });
    });

    it("isEnabled function disables field based on other properties", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Conditional Enabled Test",
            geometryType: "Point",
            fields: [
                {
                    type: "check-box",
                    propertyName: "allowEditing",
                    label: "Allow Editing",
                    checkBoxLabel: "Enable name field"
                },
                {
                    type: "text-field",
                    propertyName: "name",
                    label: "Name",
                    placeholder: "Enter name",
                    isEnabled: (properties) => properties.allowEditing === true
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        const nameInput = screen.getByPlaceholderText("Enter name") as HTMLInputElement;
        expect(nameInput).toBeDisabled();

        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        await waitFor(() => {
            expect(nameInput).toBeEnabled();
        });

        await user.type(nameInput, "Test");
        expect(nameInput.value).toBe("Test");
    });

    it("isVisible function hides field based on other properties", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Conditional Visible Test",
            geometryType: "Point",
            fields: [
                {
                    type: "check-box",
                    propertyName: "showDetails",
                    label: "Show Details",
                    checkBoxLabel: "Show additional fields"
                },
                {
                    type: "text-field",
                    propertyName: "details",
                    label: "Details",
                    placeholder: "Enter details",
                    isVisible: (properties) => properties.showDetails === true
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        expect(screen.queryByText("Details")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Enter details")).not.toBeInTheDocument();

        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        await waitFor(() => {
            expect(screen.getByText("Details")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Enter details")).toBeVisible();
        });
    });

    it("isValid function validates field based on other properties", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Conditional Valid Test",
            geometryType: "Point",
            fields: [
                {
                    type: "number-field",
                    propertyName: "minValue",
                    label: "Minimum Value"
                },
                {
                    type: "number-field",
                    propertyName: "maxValue",
                    label: "Maximum Value",
                    isValid: (properties) => {
                        const min = properties.minValue as number | undefined;
                        const max = properties.maxValue as number | undefined;
                        if (min === undefined || max === undefined) return true;
                        return max >= min;
                    }
                }
            ]
        };
        const { getContext } = renderForm({
            editingStep: createTestEditingStep(template),
            templates: [template]
        });

        const minInput = screen.getByLabelText("Minimum Value") as HTMLInputElement;
        const maxInput = screen.getByLabelText("Maximum Value") as HTMLInputElement;

        await user.type(minInput, "10");
        await user.type(maxInput, "5");

        await waitFor(() => {
            expect(getContext()?.properties.get("minValue")).toBe(10);
            expect(getContext()?.properties.get("maxValue")).toBe(5);
            expect(maxInput.getAttribute("aria-invalid")).toBe("true");
        });

        await user.clear(maxInput);
        await user.type(maxInput, "15");

        await waitFor(() => {
            expect(getContext()?.properties.get("maxValue")).toBe(15);
            expect(maxInput.getAttribute("aria-invalid")).toBeOneOf([null, "false"]);
        });
    });

    it("errorText function displays dynamic error message", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Error Text Test",
            geometryType: "Point",
            fields: [
                {
                    type: "number-field",
                    propertyName: "age",
                    label: "Age",
                    isValid: (properties) => {
                        const age = properties.age as number | undefined;
                        return age === undefined || (age >= 0 && age <= 120);
                    },
                    errorText: (properties) => {
                        const age = properties.age as number | undefined;
                        if (age === undefined) return "";
                        if (age < 0) return "Age cannot be negative";
                        if (age > 120) return "Age must be 120 or less";
                        return "";
                    }
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        const ageInput = screen.getByLabelText("Age") as HTMLInputElement;
        await user.type(ageInput, "150");
        await waitFor(() => {
            expect(screen.getByText("Age must be 120 or less")).toBeInTheDocument();
            expect(ageInput.getAttribute("aria-invalid")).toBe("true");
        });

        await user.clear(ageInput);
        await user.type(ageInput, "25");
        await waitFor(() => {
            expect(screen.queryByText("Age must be 120 or less")).not.toBeInTheDocument();
            expect(ageInput.getAttribute("aria-invalid")).toBeOneOf([null, "false"]);
        });
    });

    it("helperText static value displays helper text", async () => {
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Helper Text Test",
            geometryType: "Point",
            fields: [
                {
                    type: "text-field",
                    propertyName: "email",
                    label: "Email",
                    helperText: "Enter a valid email address"
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeDefined();
    });

    it("helperText function displays dynamic helper text", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Dynamic Helper Text Test",
            geometryType: "Point",
            fields: [
                {
                    type: "text-field",
                    propertyName: "name",
                    label: "Name",
                    placeholder: "Enter name",
                    helperText: (properties) => {
                        const name = properties.name as string | undefined;
                        if (!name) return "Name is required";
                        return `${name.length} characters entered`;
                    }
                }
            ]
        };
        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        expect(screen.getByText("Name is required")).toBeInTheDocument();

        const nameInput = screen.getByPlaceholderText("Enter name") as HTMLInputElement;
        await user.type(nameInput, "John");
        await waitFor(() => {
            expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
            expect(screen.getByText("4 characters entered")).toBeInTheDocument();
        });

        await user.type(nameInput, " Doe");
        await waitFor(() => {
            expect(screen.getByText("8 characters entered")).toBeInTheDocument();
        });
    });

    it("multiple property functions work together", async () => {
        const user = userEvent.setup();
        const template: FeatureTemplate = {
            kind: "declarative",
            name: "Combined Functions Test",
            geometryType: "Point",
            fields: [
                {
                    type: "check-box",
                    propertyName: "hasAddress",
                    label: "Has Address",
                    checkBoxLabel: "Provide address information"
                },
                {
                    type: "text-field",
                    propertyName: "street",
                    label: "Street",
                    placeholder: "Enter street",
                    isVisible: (properties) => properties.hasAddress === true,
                    isRequired: (properties) => properties.hasAddress === true,
                    helperText: (properties) =>
                        properties.hasAddress === true ? "Street address is required" : ""
                }
            ]
        };

        renderForm({ editingStep: createTestEditingStep(template), templates: [template] });

        // Initial hidden
        expect(screen.queryByText("Street")).not.toBeInTheDocument();

        // Shows street input
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);
        await waitFor(() => {
            const streetLabel = screen.getByText("Street");
            expect(streetLabel).toBeInTheDocument();

            const streetInput = screen.getByPlaceholderText("Enter street") as HTMLInputElement;
            expect(streetInput).toBeVisible();
            expect(streetInput.required).toBe(true);
            expect(screen.getByText("Street address is required")).toBeInTheDocument();
        });

        // Clicking the box hides the street input again
        await user.click(checkbox);
        await waitFor(() => {
            expect(screen.queryByText("Street")).not.toBeInTheDocument();
        });
    });
});

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

function renderForm(options?: { editingStep?: ModificationStep; templates?: FeatureTemplate[] }) {
    const { editingStep = createTestEditingStep(), templates = [allInputTypesTemplate] } =
        options ?? {};

    let lastContext: PropertyFormContext | undefined;
    const renderResult = render(
        <PackageContextProvider>
            <PropertyFormContextProvider callbacks={DUMMY_CALLBACKS} editingStep={editingStep}>
                <ContextCapture onCapture={(ctx) => (lastContext = ctx)} />
                <PropertyForm templates={templates} />
            </PropertyFormContextProvider>
        </PackageContextProvider>
    );
    return {
        ...renderResult,
        getContext: () => lastContext
    };
}

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

function createTestEditingStep(template: FeatureTemplate = allInputTypesTemplate): CreationStep {
    const feature = new Feature({
        geometry: new Point([0, 0])
    });

    return {
        id: "creation",
        feature,
        template,
        drawLayer: {} as any // Mock layer
    };
}
