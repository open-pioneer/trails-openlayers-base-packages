// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { useEffect } from "react";

import { DefaultPropertyForm } from "../implementation/components/propertyeditor/DefaultPropertyForm";
import { PropertyFormContextProvider } from "../implementation/context/PropertyFormContextProvider";
import { usePropertyFormContext } from "../implementation/context/usePropertyFormContext";
import type { PropertyFormContext } from "../api/editor/context";
import type { FeatureTemplate } from "../api/model/FeatureTemplate";
import type { CreationStep } from "../api/model/EditingStep";

describe("DefaultPropertyForm property functions", () => {
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const label = screen.getByText("Required Field");
        expect(label).toBeDefined();

        // Check for required indicator (asterisk)
        const asterisk = label.querySelector(".chakra-field__requiredIndicator");
        expect(asterisk).toBeDefined();
        expect(asterisk?.textContent).toBe("*");

        // The input should have the required attribute
        const input = screen.getByPlaceholderText("Required Field") as HTMLInputElement;
        expect(input.required).toBe(true);
        expect(input.hasAttribute("required")).toBe(true);
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const nameLabel = screen.getByText("Name");

        // Initially not required - no asterisk indicator
        let asterisk = nameLabel.querySelector(".chakra-field__requiredIndicator");
        expect(asterisk).toBeNull();

        // Enable the checkbox to make name field required
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        // Now should be required - asterisk indicator should appear
        await waitFor(() => {
            asterisk = nameLabel.querySelector(".chakra-field__requiredIndicator");
            expect(asterisk).toBeDefined();
            expect(asterisk?.textContent).toBe("*");

            // Input should have required attribute
            const nameInput = screen.getByPlaceholderText("Name") as HTMLInputElement;
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const nameInput = screen.getByPlaceholderText("Enter name") as HTMLInputElement;

        // Initially disabled - input should have disabled attribute
        expect(nameInput.disabled).toBe(true);
        expect(nameInput).toBeDisabled();

        // Enable the checkbox
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        // Now should be enabled and interactive
        await waitFor(() => {
            expect(nameInput.disabled).toBe(false);
            expect(nameInput).toBeEnabled();
        });

        // Verify we can actually type in the field
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        // Initially hidden - field should not be in the document at all
        expect(screen.queryByText("Details")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Enter details")).not.toBeInTheDocument();

        // Verify only one field is visible (the checkbox)
        const allInputs = screen.queryAllByRole("textbox");
        expect(allInputs.length).toBe(0);

        // Enable the checkbox
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        // Now should be visible and in the document
        await waitFor(() => {
            expect(screen.getByText("Details")).toBeInTheDocument();
            const detailsInput = screen.getByPlaceholderText("Enter details");
            expect(detailsInput).toBeInTheDocument();
            expect(detailsInput).toBeVisible();
        });
    });

    it("isValid function validates field based on other properties", async () => {
        const user = userEvent.setup();
        let context: PropertyFormContext | undefined;

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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <ContextCapture onCapture={(ctx) => (context = ctx)} />
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const minInput = screen.getByLabelText("Minimum Value") as HTMLInputElement;
        const maxInput = screen.getByLabelText("Maximum Value") as HTMLInputElement;

        // Set min to 10
        await user.type(minInput, "10");

        // Set max to 5 (invalid - less than min)
        await user.type(maxInput, "5");

        await waitFor(() => {
            expect(context).toBeDefined();
            expect(context!.properties.get("minValue")).toBe(10);
            expect(context!.properties.get("maxValue")).toBe(5);
        });

        // The max field should be marked as invalid
        await waitFor(() => {
            const maxFieldRoot = maxInput.closest('[data-scope="field"]');
            expect(maxFieldRoot).toBeDefined();
            expect(maxFieldRoot?.hasAttribute("data-invalid")).toBe(true);
            expect(maxInput.getAttribute("aria-invalid")).toBe("true");
        });

        // Change max to 15 (valid - greater than min)
        await user.clear(maxInput);
        await user.type(maxInput, "15");

        await waitFor(() => {
            expect(context!.properties.get("maxValue")).toBe(15);
            // Now should be valid - aria-invalid is null or "false"
            const ariaInvalid = maxInput.getAttribute("aria-invalid");
            expect(ariaInvalid === null || ariaInvalid === "false").toBe(true);
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const ageInput = screen.getByLabelText("Age") as HTMLInputElement;

        // Enter an invalid age
        await user.type(ageInput, "150");

        // Check for error message and invalid state
        await waitFor(() => {
            const errorMessage = screen.getByText("Age must be 120 or less");
            expect(errorMessage).toBeInTheDocument();

            // Verify aria-invalid on input
            expect(ageInput.getAttribute("aria-invalid")).toBe("true");

            // Field should be marked invalid
            const fieldRoot = ageInput.closest('[data-scope="field"]');
            expect(fieldRoot).toBeDefined();
            expect(fieldRoot?.hasAttribute("data-invalid")).toBe(true);
        });

        // Enter a valid age
        await user.clear(ageInput);
        await user.type(ageInput, "25");

        await waitFor(() => {
            // Error message should be gone
            expect(screen.queryByText("Age must be 120 or less")).not.toBeInTheDocument();

            // Field should be valid - aria-invalid is null or "false"
            const ariaInvalid = ageInput.getAttribute("aria-invalid");
            expect(ariaInvalid === null || ariaInvalid === "false").toBe(true);
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        const helperText = screen.getByText("Enter a valid email address");
        expect(helperText).toBeInTheDocument();

        // Verify it's in a helper text container
        const helperContainer = helperText.closest('[data-scope="field.helper-text"]');
        expect(helperContainer).toBeDefined();

        // Helper text should be associated with the field
        const emailInput = screen.getByLabelText("Email");
        expect(emailInput).toBeDefined();
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
                        const length = name.length;
                        return `${length} characters entered`;
                    }
                }
            ]
        };

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        // Initially shows "Name is required"
        let helperText = screen.getByText("Name is required");
        expect(helperText).toBeInTheDocument();
        expect(helperText.closest('[data-scope="field.helper-text"]')).toBeDefined();

        const nameInput = screen.getByPlaceholderText("Enter name") as HTMLInputElement;
        await user.type(nameInput, "John");

        // Should update to show character count
        await waitFor(() => {
            expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
            helperText = screen.getByText("4 characters entered");
            expect(helperText).toBeInTheDocument();
        });

        // Type more characters
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

        const editingStep = createTestEditingStep(template);

        render(
            <PackageContextProvider>
                <PropertyFormContextProvider editingStep={editingStep}>
                    <DefaultPropertyForm
                        title="Test Form"
                        templates={[template]}
                        formTemplateProvider={undefined}
                    />
                </PropertyFormContextProvider>
            </PackageContextProvider>
        );

        // Initially street field is hidden
        expect(screen.queryByText("Street")).not.toBeInTheDocument();

        // Enable the checkbox
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        // Now street field should be visible, required, and have helper text
        await waitFor(() => {
            const streetLabel = screen.getByText("Street");
            expect(streetLabel).toBeInTheDocument();

            const streetInput = screen.getByPlaceholderText("Enter street") as HTMLInputElement;
            expect(streetInput).toBeVisible();

            // Verify required state by checking for the asterisk indicator
            const asterisk = streetLabel.querySelector(".chakra-field__requiredIndicator");
            expect(asterisk).toBeDefined();
            expect(asterisk?.textContent).toBe("*");

            // Input should have required attribute
            expect(streetInput.required).toBe(true);

            // Verify helper text
            const helperText = screen.getByText("Street address is required");
            expect(helperText).toBeInTheDocument();
        });

        // Disable checkbox to hide field again
        await user.click(checkbox);

        await waitFor(() => {
            expect(screen.queryByText("Street")).not.toBeInTheDocument();
            expect(screen.queryByPlaceholderText("Enter street")).not.toBeInTheDocument();
        });
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

function createTestEditingStep(template: FeatureTemplate): CreationStep {
    const feature = new Feature({
        geometry: new Point([0, 0])
    });

    return {
        id: "create-modify",
        feature,
        template,
        drawOlLayer: {} as any // Mock OL layer
    };
}
