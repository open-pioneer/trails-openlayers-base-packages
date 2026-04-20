// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FeatureEditor, FeatureWriter, type FeatureTemplate } from "@open-pioneer/feature-editing";
import { LayerFactory, MapModel, SimpleLayer, useMapModelValue } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Collection, Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useMemo, type ReactElement } from "react";

export function SimpleEditorComponent(): ReactElement | undefined {
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

        // The template defines the orm content when a feature is being edited / created.
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
