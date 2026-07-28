# @open-pioneer/feature-editing

This package provides editing functionality for map features.
It supports creating, modifying, and deleting features with declarative form configuration and custom UI components.

## Features

- **Feature creation**: Draw new geometries (points, lines, polygons) on the map
- **Feature modification**: Edit existing feature geometries and attributes
- **Feature deletion**: Remove features with confirmation dialog
- **Declarative forms**: Configure property forms using simple field configurations
- **Custom forms**: Build completely custom forms for advanced use cases
- **Dynamic field behavior**: Conditional visibility, validation, and enabled states
- **Snapping**: Snap to existing features during drawing and modification
- **Undo/redo**: Built-in support for geometry editing history

The Editing works with all vector layer sources and can therefore be used with any layer type that supports feature selection, such as `GeoJSON`, `WFS`, or `OGC API Features`.
To save feature edits, a `FeatureWriter` ([see below](#FeatureWriter)) has to be implemented.
As the package does not manage feature storage or how changes are applied to the map, it fits a wide range of data management strategies and provides full flexibility to the using app.

## Usage

The simplest way to use the FeatureEditor is to provide feature templates and a `writer` implementation:

```tsx
import {
    FeatureEditor,
    type FeatureWriter,
    type FeatureTemplate
} from "@open-pioneer/feature-editing";

function EditorComponent() {
    return <FeatureEditor templates={templates} writer={featureWriter} />;
}

const templates: FeatureTemplate[] = [
    {
        name: "Point of Interest",
        kind: "declarative",
        geometryType: "Point",
        layerId: "poi-layer", // creation not shown in this example
        fields: [
            { label: "Name", type: "text-field", propertyName: "name", isRequired: true },
            { label: "Description", type: "text-area", propertyName: "description" }
        ]
    }
];

const featureWriter: FeatureWriter = {
    async addFeature(feature, template, projection) {
        // Persist the new feature in your backend, then update the map
        await myApi.createFeature(feature, template.layerId);
    },
    async updateFeature({ feature, layer, projection }) {
        // Update the existing feature in your backend, then update the map
        await myApi.updateFeature(feature, layer?.id);
    },
    async deleteFeature({ feature, layer, projection }) {
        // Delete the feature from your backend, then update the map
        await myApi.deleteFeature(feature, layer?.id);
    }
};
```

## Core Concepts

### Feature Templates

Feature templates define what types of features can be created and how their properties are edited. Each template specifies:

- **Geometry type**: `"Point"`, `"LineString"`, `"Polygon"` or `"Circle"`. It is also possible to create _rectangle_ geometries (see example below).
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
    defaultProperties: {
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

#### Example: Rectangle geometries

To create rectangle geometries, set `geometryType` to `"Circle"` and provide a `geometryFunction` that creates rectangle geometries using the `createBox` function from OpenLayers:

```tsx
import { createBox } from "ol/interaction/Draw";

const template: FeatureTemplate = {
    kind: "declarative",
    geometryType: "Circle",

    // ...

    drawingOptions: {
        geometryFunction: createBox()
    },
    fields: [
        // ...
    ]
};
```

### Data flow

The editor supports editing _existing_ features or creating _new_ features:

- Existing features are taken from the map, using a workflow based on OpenLayer's [Select](https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html) interaction.
  The feature object and its attributes are taken directly from the layer (typically some kind of `VectorLayer`).
- New feature objects are created based on the configured feature template (i.e. `defaultProperties`, `geometryType`, etc.).
  The user can draw the feature's geometry on a temporary layer.

In both cases, feature attributes can be edited using the editor's form controls.
Note however, that the layers or their sources in the map are **never** modified directly.
Instead, the editor calls the `FeatureWriter`'s methods to apply any changes made by the user (see [FeatureWriter](#featurewriter) below).

In summary, the sequence of steps when creating or editing a feature is as follows:

1. A feature is either selected from the map or created based on the feature template.
2. The user edits the feature's geometry or properties using the editor component.
3. The editor calls `addFeature`, `updateFeature` or `deleteFeature` on the `featureWriter` based on the user's actions.
   The feature writer ensures that:
    - Changes are persisted (if needed)
    - _Vector sources are updated_, i.e. changes are applied to the map
4. Optional: if the user selects a feature again, they will observe the updated attributes / geometries.

#### Example

The following self-contained example demonstrates of all the relevant bits and pieces.

```tsx
import { FeatureEditor, FeatureWriter, type FeatureTemplate } from "@open-pioneer/feature-editing";
import { LayerFactory, MapModel, SimpleLayer, useMapModelValue } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Collection, Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useMemo } from "react";

export function SimpleEditorComponent() {
    const map = useMapModelValue();
    const { featureWriter, template } = useEditingSetup(map);

    return (
        <TitledSection>
            <SectionHeading size="md" mb={2}>
                Editor
            </SectionHeading>
            <FeatureEditor templates={[template]} writer={featureWriter} />
        </TitledSection>
    );
}

// Extremely basic editing example to demonstrate the different bits and their interactions.
// In a real application, you would typically:
// - have more than one layer (maybe even more than one feature template per layer)
// - have actual persistence
// - split the bits into multiple classes and files in more sensible locations
// - ...
function useEditingSetup(map: MapModel) {
    const layerFactory = useService<LayerFactory>("map.LayerFactory");
    const options = useMemo(() => {
        // The collection contains the layer's features.
        // The collection is shared by the layer (read side, OpenLayers support) and the FeatureWriter implementation (write side).
        // This is the simplest way to notify the OpenLayers VectorLayer about changes in the underlying data.
        const featureCollection = new Collection<Feature>();

        // Callback to "store" data (just a fancy array in this case).
        const featureWriter: FeatureWriter = {
            addFeature: async ({ feature }) => {
                featureCollection.push(feature);
            },
            updateFeature: async ({ feature }) => {
                const index = featureCollection.getArray().indexOf(feature);
                if (index >= 0) {
                    // Triggers an update, even though we write the same feature again.
                    featureCollection.setAt(index, feature);
                }
            },
            deleteFeature: async ({ feature }) => {
                featureCollection.remove(feature);
            }
        };

        // The template defines the form content when a feature is being edited / created.
        // It also contains the defaultAttributes and the geometryType for _new_ features.
        const template: FeatureTemplate = {
            name: "Simple Point Feature",
            kind: "declarative",
            geometryType: "Point",
            layerId: "simple-editable-layer",
            fields: [
                { label: "Title", type: "text-field", propertyName: "title", isRequired: false }
            ],
            defaultProperties: {
                title: ""
            }
        };
        return { featureCollection, featureWriter, template };
    }, []);

    // Quick and dirty: mount layer in the map
    useEffect(() => {
        // Layer for visualization and selection in the map.
        const layer = layerFactory.create({
            type: SimpleLayer,
            id: "simple-editable-layer",
            title: "Simple Editable Layer",
            olLayer: new VectorLayer({
                source: new VectorSource({
                    features: options.featureCollection
                }),
                updateWhileAnimating: true,
                updateWhileInteracting: true
            })
        });
        map.layers.addLayer(layer);
        return () => {
            map.layers.removeLayer(layer);
            layer.destroy();
        };
    }, [map, layerFactory, options.featureCollection]);
    return options;
}
```

### FeatureWriter

The editor does not manage the lifetime of any features in the map, except for the feature currently being edited.
To persist changes made by the editor, you must implement the `FeatureWriter` interface.

Note: there is currently no prepared FeatureWriter implementation for `WFS` or `OGC API Features` services available.

The interface is flexible enough to work in many scenarios:

- Transient client side state (e.g. an in-memory collection used for a `VectorSource`)
- Persistent client side storage (e.g. Origin private file system)
- Service side storage (e.g. REST APIs)

All functions are async and should apply the changes made by the user to the backing data structures or services.
For example, to persist changes using a (fictional) REST API:

```tsx
const featureWriter: FeatureWriter = {
    // Called when a new feature is created
    async addFeature({ feature, template, projection }) {
        const geojson = new GeoJSON().writeFeatureObject(feature, {
            featureProjection: projection
        });
        await fetch(`/api/layers/${template.layerId}/features`, {
            method: "POST",
            body: JSON.stringify(geojson)
        });
        // Update map/layers (e.g. VectorSources)
    },

    // Called when an existing feature is modified
    async updateFeature({ feature, layer, projection }) {
        const id = feature.getId();
        const geojson = new GeoJSON().writeFeatureObject(feature, {
            featureProjection: projection
        });
        await fetch(`/api/layers/${layer?.id}/features/${id}`, {
            method: "PUT",
            body: JSON.stringify(geojson)
        });
        // Update map/layers (e.g. VectorSources)
    },

    // Called when a feature is deleted
    async deleteFeature({ feature, layer, projection }) {
        const id = feature.getId();
        await fetch(`/api/layers/${layer?.id}/features/${id}`, {
            method: "DELETE"
        });
        // Update map/layers (e.g. VectorSources)
    }
};
```

If a storage function throws an error, it is logged and a generic error notification is shown to the user.
On success, a success notification is shown.

To supply an additional message for the error notification, return an object of type `StorageError` instead:

```ts
const featureWriter: FeatureWriter = {
    addFeature: async ({ feature, template, projection }) => {
        // ...
        LOG.error("Failed to do X", error);
        return { kind: "error", message: "Insufficient permissions" };
    }
};
```

## FeatureEditor Props

The `FeatureEditor` component accepts the following props:

| Prop                             | Type                                     | Required | Description                                                                                                                     |
| -------------------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `map`                            | `MapModel`                               | No       | Map model to use (defaults to context map)                                                                                      |
| `templates`                      | `FeatureTemplate[]`                      | Yes      | Feature templates defining the types of features that can be created or edited                                                  |
| `writer`                         | `FeatureWriter`                          | Yes      | Storage implementation for feature create, update, and delete operations                                                        |
| `selectableLayers`               | `Layer[]`                                | No       | Layers from which features can be selected. Defaults to layers matching template layer IDs                                      |
| `snappableLayers`                | `Layer[]`                                | No       | Layers for snapping during drawing/modification. Defaults to `selectableLayers`                                                 |
| `resolveFormTemplate`            | `(context) => FormTemplate \| undefined` | No       | Custom function to determine which form template to use when editing an existing feature (see below)                            |
| `showActionBar`                  | `boolean`                                | No       | Whether to show undo/redo/finish/reset controls during drawing (default: `true`)                                                |
| `successNotifierDisplayDuration` | `number \| false`                        | No       | Duration in ms to display success notifications. By default, never disappears. Use `false` to completely hide the notification. |
| `failureNotifierDisplayDuration` | `number \| false`                        | No       | Duration in ms to display failure notifications. By default, never disappears. Use `false` to completely hide the notification. |
| `onEditingStepChange`            | `(newEditingStep) => void`               | No       | Callback invoked when the editing workflow step changes                                                                         |

### Interaction Options

The FeatureEditor also accepts OpenLayers interaction options for fine-grained control:

| Prop                  | Type                  | Description                        |
| --------------------- | --------------------- | ---------------------------------- |
| `drawingOptions`      | `DrawingOptions`      | Options for the Draw interaction   |
| `selectionOptions`    | `SelectionOptions`    | Options for the Select interaction |
| `modificationOptions` | `ModificationOptions` | Options for the Modify interaction |
| `snappingOptions`     | `SnappingOptions`     | Options for the Snap interaction   |
| `highlightingOptions` | `HighlightOptions`    | Options for feature highlighting   |

The drawing options will be merged with those of the selected feature template (if any are given), with the ones of the template taking precedence.

### Resolving Form Templates

When the user selects an existing feature on the map, the FeatureEditor needs to determine which form template to use.
By default, it matches the feature's layer ID against the `layerId` of each template in the `templates` array and uses the first match.

For more control — such as when features from the same layer require different forms based on their attributes — you can provide a custom `resolveFormTemplate` callback:

```tsx
const resolveFormTemplate = ({ feature, layer }: FormTemplateContext) => {
    const type = feature.get("type");
    return type === "residential" ? residentialTemplate : commercialTemplate;
};

<FeatureEditor
    templates={[residentialTemplate, commercialTemplate]}
    resolveFormTemplate={resolveFormTemplate}
    writer={featureWriter}
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
    readonly type: string; // Type of input control
    readonly propertyName: string; // Feature property to edit
    readonly isRequired?: PropertyFunctionOr<boolean>; // Required validation
    readonly isEnabled?: PropertyFunctionOr<boolean>; // Enable/disable state
    readonly isVisible?: PropertyFunctionOr<boolean>; // Show/hide field
    readonly isValid?: PropertyFunctionOr<boolean>; // Custom validation
    readonly errorText?: PropertyFunctionOr<string | undefined>; // Error message
    readonly helperText?: PropertyFunctionOr<string | undefined>; // Info text
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
                    value={[(value as number | undefined) ?? 50]}
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
import { usePropertyFormContext, type FeatureTemplate } from "@open-pioneer/feature-editing";
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

## Editing Workflow Steps

The editing workflow progresses through these steps:

| Step ID         | Description                           | Active Interaction     |
| --------------- | ------------------------------------- | ---------------------- |
| `none`          | No active editing operation           | None                   |
| `create-draw`   | Drawing a new feature's geometry      | Draw                   |
| `create-modify` | Modifying a newly drawn feature       | Modify + property form |
| `update-select` | Selecting an existing feature to edit | Select                 |
| `update-modify` | Modifying an existing feature         | Modify + property form |

## Supported keyboard shortcuts (create feature)

The following keyboard shortcuts are supported while drawing the initial feature geometry (not during editing of existing features):

| Shortcut           | Description                      |
| ------------------ | -------------------------------- |
| `Ctrl/Command + Z` | Undo last geometry change        |
| `Ctrl/Command + Y` | Redo last undone geometry change |
| `Enter`            | Finish drawing or modification   |
| `Escape`           | Cancel drawing or modification   |

## License

Apache-2.0 (see `LICENSE` file)
