# @open-pioneer/new-editing

This package provides editing functionality for map features. It supports creating, modifying, and deleting features with declarative form configuration and custom UI components.

## Features

- **Feature creation**: Draw new geometries (points, lines, polygons) on the map
- **Feature modification**: Edit existing feature geometries and attributes
- **Feature deletion**: Remove features with confirmation dialog
- **Declarative forms**: Configure property forms using simple field configurations
- **Custom forms**: Build completely custom forms for advanced use cases
- **Dynamic field behavior**: Conditional visibility, validation, and enabled states
- **Snapping**: Snap to existing features during drawing and modification
- **Undo/redo**: Built-in support for geometry editing history

## Getting Started

### Minimum Working Example

The simplest way to use the Editor is to provide feature templates and an editing handler:

```tsx
import { Editor, type EditingHandler, type FeatureTemplate } from "@open-pioneer/new-editing";

function EditingComponent() {
    return <Editor templates={templates} editingHandler={editingHandler} />;
}

const templates: FeatureTemplate[] = [
    {
        name: "Point of Interest",
        kind: "declarative",
        geometryType: "Point",
        layerId: "poi-layer",
        fields: [
            { label: "Name", type: "text-field", propertyName: "name", isRequired: true },
            { label: "Description", type: "text-area", propertyName: "description" }
        ]
    }
];

const editingHandler: EditingHandler = {
    async addFeature(feature, template, projection) {
        // Persist the new feature to your backend
        await myApi.createFeature(feature, template.layerId);
    },
    async updateFeature(feature, layer, projection) {
        // Update the existing feature in your backend
        await myApi.updateFeature(feature, layer?.id);
    },
    async deleteFeature(feature, layer, projection) {
        // Delete the feature from your backend
        await myApi.deleteFeature(feature, layer?.id);
    }
};
```

## Core Concepts

### Feature Templates

Feature templates define what types of features can be created and how their properties are edited. Each template specifies:

- **Geometry type**: `"Point"`, `"LineString"`, `"Polygon"`, `"Circle"`, etc.
- **Form configuration**: Either declarative fields or a custom render function
- **Layer association**: Links the template to a map layer for selection
- **Drawing options**: Customizes the OpenLayers Draw interaction

```tsx
const template: FeatureTemplate = {
    // Display name shown in the UI
    name: "Forest Damage Report",

    // Form configuration (declarative or dynamic)
    kind: "declarative",

    // Optional icon displayed in template selector
    icon: <TreeIcon />,

    // Geometry type for new features
    geometryType: "Point",

    // Associated layer ID for feature selection
    layerId: "forest-damage",

    // Default property values for new features
    prototype: {
        status: "pending",
        reportedAt: new Date().toISOString()
    },

    // Form fields (for declarative templates)
    fields: [
        { label: "Tree Species", type: "text-field", propertyName: "species" }
        // ... more fields
    ],

    // Optional drawing customization
    drawingOptions: {
        style: new Style({
            /* ... */
        })
    }
};
```

### Editing Handler

The editing handler provides callbacks for persisting feature changes. All handlers are async and should interact with your backend service:

```tsx
const editingHandler: EditingHandler = {
    // Called when a new feature is created
    async addFeature(feature, template, projection) {
        const geojson = new GeoJSON().writeFeatureObject(feature, {
            featureProjection: projection
        });
        await fetch(`/api/layers/${template.layerId}/features`, {
            method: "POST",
            body: JSON.stringify(geojson)
        });
    },

    // Called when an existing feature is modified
    async updateFeature(feature, layer, projection) {
        const id = feature.getId();
        const geojson = new GeoJSON().writeFeatureObject(feature, {
            featureProjection: projection
        });
        await fetch(`/api/layers/${layer?.id}/features/${id}`, {
            method: "PUT",
            body: JSON.stringify(geojson)
        });
    },

    // Called when a feature is deleted
    async deleteFeature(feature, layer, projection) {
        const id = feature.getId();
        await fetch(`/api/layers/${layer?.id}/features/${id}`, {
            method: "DELETE"
        });
    }
};
```

If a handler throws an error, it is caught and displayed to the user as an error notification. On success, a success notification is shown.

## Editor Props

The `Editor` component accepts the following props:

| Prop                             | Type                   | Required | Description                                                                                                 |
| -------------------------------- | ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `map`                            | `MapModel`             | No       | Map model to use (defaults to context map)                                                                  |
| `templates`                      | `FeatureTemplate[]`    | Yes      | Feature templates defining the types of features that can be created or edited                              |
| `editingHandler`                 | `EditingHandler`       | Yes      | Handler for feature create, update, and delete operations                                                   |
| `selectableLayers`               | `Layer[]`              | No       | Layers from which features can be selected. Defaults to layers matching template layer IDs                  |
| `snappableLayers`                | `Layer[]`              | No       | Layers for snapping during drawing/modification. Defaults to `selectableLayers`                             |
| `formTemplateProvider`           | `FormTemplateProvider` | No       | Custom function to determine which form template to use when editing an existing feature (see below)        |
| `title`                          | `string`               | No       | Title displayed at the top of the editor. Defaults to a localized title or the template name during editing |
| `showActionBar`                  | `boolean`              | No       | Whether to show undo/redo/finish/reset controls during drawing (default: `true`)                            |
| `successNotifierDisplayDuration` | `number`               | No       | Duration in ms to display success notifications. By default, never disappears. Use `0` to hide entirely     |
| `failureNotifierDisplayDuration` | `number`               | No       | Duration in ms to display failure notifications. By default, never disappears. Use `0` to hide entirely     |
| `onEditingStepChange`            | `OnEditingStepChange`  | No       | Callback invoked when the editing workflow step changes                                                     |

### Interaction Options

The Editor also accepts OpenLayers interaction options for fine-grained control:

| Prop                  | Type                  | Description                        |
| --------------------- | --------------------- | ---------------------------------- |
| `drawingOptions`      | `DrawingOptions`      | Options for the Draw interaction   |
| `selectionOptions`    | `SelectionOptions`    | Options for the Select interaction |
| `modificationOptions` | `ModificationOptions` | Options for the Modify interaction |
| `snappingOptions`     | `SnappingOptions`     | Options for the Snap interaction   |
| `highlightingOptions` | `HighlightOptions`    | Options for feature highlighting   |

The drawing options will be merged with those of the selected feature template (if any are given), with the ones of the template taking precedence.

### Form Template Provider

When the user selects an existing feature on the map, the Editor needs to determine which form template to use.
By default, it matches the feature's layer ID against the `layerId` of each template in the `templates` array and uses the first match.

For more control—such as when features from the same layer require different forms based on their attributes—you can provide a custom `formTemplateProvider`:

```tsx
const formTemplateProvider: FormTemplateProvider = (feature, layer) => {
    const type = feature.get("type");
    return type === "residential" ? residentialTemplate : commercialTemplate;
};

<Editor
    templates={[residentialTemplate, commercialTemplate]}
    formTemplateProvider={formTemplateProvider}
    editingHandler={handler}
/>;
```

## Field Types

### Standard Fields

| Type           | Description                            | Key Properties                                            |
| -------------- | -------------------------------------- | --------------------------------------------------------- |
| `text-field`   | Single-line text input                 | `placeholder`                                             |
| `text-area`    | Multi-line text input                  | `placeholder`                                             |
| `number-field` | Numeric input with validation          | `min`, `max`, `formatOptions`, `step`, `showSteppers`     |
| `check-box`    | Boolean checkbox                       | `checkBoxLabel`                                           |
| `switch`       | Boolean toggle switch                  | `switchLabel`                                             |
| `date-picker`  | Date or datetime picker                | `includeTime`                                             |
| `color-picker` | Color selection with optional swatches | `swatchColors`                                            |
| `select`       | Dropdown selection                     | `options`, `valueType`, `placeholder`, `showClearTrigger` |
| `combo-box`    | Searchable dropdown                    | `options`, `valueType`, `placeholder`, `showClearTrigger` |
| `radio-group`  | Radio button group                     | `options`, `valueType`                                    |
| `custom`       | Custom render function                 | `render`                                                  |

### Common Field Properties

All fields share these base properties:

```tsx
interface BaseFieldConfig {
    readonly label: string; // Display label
    readonly propertyName: string; // Feature property to edit
    readonly isRequired?: PropertyFunctionOr<boolean>; // Required validation
    readonly isEnabled?: PropertyFunctionOr<boolean>; // Enable/disable state
    readonly isVisible?: PropertyFunctionOr<boolean>; // Show/hide field
    readonly isValid?: PropertyFunctionOr<boolean>; // Custom validation
    readonly errorText?: PropertyFunctionOr<string>; // Error message
    readonly helperText?: PropertyFunctionOr<string>; // Info text
}
```

## Property Functions

Field properties that accept `PropertyFunctionOr<T>` can be either static values or functions that compute values dynamically based on current feature properties. This enables conditional field behavior:

```tsx
const fields: FieldConfig[] = [
    {
        label: "Damage Type",
        type: "select",
        propertyName: "damageType",
        valueType: "string",
        options: [
            { label: "Storm", value: "storm" },
            { label: "Fire", value: "fire" },
            { label: "Pest", value: "pest" }
        ]
    },
    {
        label: "Pest Species",
        type: "text-field",
        propertyName: "pestName",
        // Only visible when damage type is "pest"
        isVisible: (properties) => properties.damageType === "pest",
        // Required only when visible
        isRequired: (properties) => properties.damageType === "pest"
    },
    {
        label: "Affected Area (m²)",
        type: "number-field",
        propertyName: "affectedArea",
        min: 0,
        // Custom validation with dynamic error message
        isValid: (properties) => {
            const area = properties.affectedArea as number;
            return area == null || area <= 10000;
        },
        errorText: "Area must not exceed 10,000 m²"
    }
];
```

## Customization

### Custom Input Controls

Use the `custom` field type to render any input control within a declarative form. The render function receives the current value and an onChange callback:

```tsx
import { Slider } from "@chakra-ui/react";

const template: FeatureTemplate = {
    name: "Survey Point",
    kind: "declarative",
    geometryType: "Point",
    fields: [
        {
            label: "Confidence Level",
            type: "custom",
            propertyName: "confidence",
            render: (value, onChange) => (
                <Slider.Root
                    value={[(value as number) ?? 50]}
                    onValueChange={(details) => onChange(details.value[0])}
                    min={0}
                    max={100}
                >
                    <Slider.Control>
                        <Slider.Track>
                            <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                    </Slider.Control>
                </Slider.Root>
            )
        }
    ]
};
```

### Custom Forms with Property Form Context

For complete control over form layout and behavior, use a dynamic form template with the `usePropertyFormContext` hook:

```tsx
import { usePropertyFormContext, type FeatureTemplate } from "@open-pioneer/new-editing";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Field, Input, VStack } from "@chakra-ui/react";
import { useEffect } from "react";

function CustomSurveyForm() {
    const context = usePropertyFormContext();

    // Read properties reactively - component re-renders when values change
    const name = useReactiveSnapshot(() => context.properties.get("name") ?? "", [context]);
    const email = useReactiveSnapshot(() => context.properties.get("email") ?? "", [context]);

    // Manage form validity
    useEffect(() => {
        context.isValid = name.length >= 1 && email.includes("@");
    }, [context, name, email]);

    return (
        <VStack gap={4} align="stretch">
            <Field.Root required>
                <Field.Label>Surveyor Name</Field.Label>
                <Input
                    value={name}
                    onChange={(e) => context.properties.set("name", e.target.value)}
                />
            </Field.Root>

            <Field.Root required>
                <Field.Label>Email</Field.Label>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => context.properties.set("email", e.target.value)}
                />
            </Field.Root>

            {/* Access editing mode */}
            {context.mode === "update" && <p>Editing feature from layer: {context.layer?.title}</p>}
        </VStack>
    );
}

const template: FeatureTemplate = {
    name: "Survey",
    kind: "dynamic",
    geometryType: "Point",
    layerId: "surveys",
    renderForm: () => <CustomSurveyForm />
};
```

The `PropertyFormContext` provides:

| Property           | Type                            | Description                          |
| ------------------ | ------------------------------- | ------------------------------------ |
| `feature`          | `Feature`                       | The OpenLayers feature being edited  |
| `properties`       | `ReactiveMap<string, unknown>`  | Reactive map of feature properties   |
| `propertiesObject` | `() => Record<string, unknown>` | Returns properties as a plain object |
| `mode`             | `"create" \| "update"`          | Current editing mode                 |
| `template`         | `FeatureTemplate \| undefined`  | Template used (only in create mode)  |
| `layer`            | `Layer \| undefined`            | Source layer (only in update mode)   |
| `isValid`          | `boolean`                       | Controls save button enabled state   |

### Custom Editor with useEditing()

For complete control over the editing UI, use the `useEditing` hook directly:

```tsx
import {
    useEditing,
    type EditingStep,
    type DrawingState,
    type FeatureTemplate
} from "@open-pioneer/new-editing";

import { useState } from "react";
import type { Vector as VectorSource } from "ol/source";

function CustomEditor({ templates, snappingSources }: CustomEditorProps) {
    const [editingStep, setEditingStep] = useState<EditingStep>({ id: "none" });

    const drawingState: DrawingState = useEditing({
        map: myMapModel,
        editingStep,
        setEditingStep,
        snappingSources
    });

    // Start drawing a new feature
    const startDrawing = (template: FeatureTemplate) => {
        setEditingStep({ id: "create-draw", template });
    };

    // Cancel current operation
    const cancel = () => {
        setEditingStep({ id: "none" });
    };

    return (
        <div>
            {/* Template buttons */}
            {templates.map((template) => (
                <button key={template.name} onClick={() => startDrawing(template)}>
                    {template.name}
                </button>
            ))}

            {/* Drawing controls */}
            {editingStep.id === "create-draw" && (
                <div>
                    <button onClick={drawingState.undo} disabled={!drawingState.canUndo}>
                        Undo
                    </button>
                    <button onClick={drawingState.redo} disabled={!drawingState.canRedo}>
                        Redo
                    </button>
                    <button onClick={drawingState.finish} disabled={!drawingState.canFinish}>
                        Finish
                    </button>
                    <button onClick={drawingState.reset} disabled={!drawingState.canReset}>
                        Reset
                    </button>
                    <button onClick={cancel}>Cancel</button>
                </div>
            )}

            {/* Handle modification step */}
            {editingStep.id === "create-modify" && (
                <div>
                    <p>Editing feature properties...</p>
                    {/* Render your custom property form */}
                </div>
            )}
        </div>
    );
}

interface CustomEditorProps {
    readonly templates: FeatureTemplate[];
    readonly snappingSources?: VectorSource[];
}
```

The `useEditing` hook manages map interactions and returns a `DrawingState` object with:

| Property    | Type         | Description                                  |
| ----------- | ------------ | -------------------------------------------- |
| `undo`      | `() => void` | Undo the last geometry modification          |
| `redo`      | `() => void` | Redo a previously undone modification        |
| `finish`    | `() => void` | Complete the drawing and commit the geometry |
| `reset`     | `() => void` | Clear the drawn geometry and start over      |
| `canUndo`   | `boolean`    | Whether undo is available                    |
| `canRedo`   | `boolean`    | Whether redo is available                    |
| `canFinish` | `boolean`    | Whether the geometry can be finished         |
| `canReset`  | `boolean`    | Whether the geometry can be reset            |

## Editing Workflow Steps

The editing workflow progresses through these steps:

| Step ID         | Description                           | Active Interaction     |
| --------------- | ------------------------------------- | ---------------------- |
| `none`          | No active editing operation           | None                   |
| `create-draw`   | Drawing a new feature's geometry      | Draw                   |
| `create-modify` | Modifying a newly drawn feature       | Modify + property form |
| `update-select` | Selecting an existing feature to edit | Select                 |
| `update-modify` | Modifying an existing feature         | Modify + property form |

## License

Apache-2.0 (see `LICENSE` file)
