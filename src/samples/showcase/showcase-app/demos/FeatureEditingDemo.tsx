// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { FeatureEditor, FeatureWriter, type FeatureTemplate } from "@open-pioneer/feature-editing";
import {
    LayerFactory,
    MapModel,
    SimpleLayer,
    type Layer,
    useMapModelValue
} from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ReactElement, ReactNode, useEffect, useMemo } from "react";
import { Collection, Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";
import { LAYER_CONFIG } from "./feature-editing/layerConfig";

export function createFeatureEditingDemo(options: SharedDemoOptions): Demo {
    return {
        id: "featureEditing",
        title: options.intl.formatMessage({ id: "demos.featureEditing.title" }),
        createModel() {
            return new DemoModelImpl(options);
        }
    };
}

class DemoModelImpl implements DemoModel {
    description: ReactNode;
    mainWidget: ReactNode;

    constructor(options: SharedDemoOptions) {
        const { intl } = options;
        this.description = intl.formatRichMessage({ id: "demos.featureEditing.description" });
        this.mainWidget = <EditorComponent />;
    }
}

function EditorComponent(): ReactElement | undefined {
    const intl = useIntl();
    const mapModel = useMapModelValue();
    const layerFactory = useService<LayerFactory>("map.LayerFactory");
    const title = intl.formatMessage({ id: "demos.featureEditing.editorTitle" });
    const collections = useMemo(() => createCollections(), []);
    const writer = useMemo(() => createFeatureWriter(collections), [collections]);
    const templates = useFeatureTemplates();

    // Quick and dirty: mount layer in the map
    useEffect(() => {
        // Layer for visualization and selection in the map.
        const layers = createVectorLayers(mapModel, layerFactory, collections);
        return () => {
            for (const layer of layers) {
                mapModel.layers.removeLayer(layer);
                layer.destroy();
            }
        };
    }, [collections, layerFactory, mapModel]);

    return (
        <Box
            height="full"
            padding={4}
            backgroundColor="bg"
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
            display="flex"
            flexDirection="column"
        >
            <TitledSection>
                <SectionHeading size="md" mb={2}>
                    {title}
                </SectionHeading>
                <Box flex="1" overflowY="auto">
                    <FeatureEditor templates={templates} writer={writer} />
                </Box>
            </TitledSection>
        </Box>
    );
}

function createFeatureWriter(collections: Map<string, Collection<Feature>>): FeatureWriter {
    const getCollection = (layerId: string | undefined) => {
        if (!layerId) {
            throw new Error("Missing layer id.");
        }
        const collection = collections.get(layerId);
        if (!collection) {
            throw new Error(`No collection found for layer '${layerId}'.`);
        }
        return collection;
    };
    return {
        addFeature: async ({ feature, template }) => {
            const collection = getCollection(template.layerId);
            collection.push(feature.clone());
        },
        updateFeature: async ({ feature, layer }) => {
            const collection = getCollection(layer?.id);
            const index = collection.getArray().indexOf(feature);
            if (index < 0) {
                throw new Error("Feature not found in collection.");
            }
            collection.setAt(index, feature.clone());
        },
        deleteFeature: async ({ feature, layer }) => {
            const collection = getCollection(layer?.id);
            const index = collection.getArray().indexOf(feature);
            if (index < 0) {
                throw new Error("Feature not found in collection.");
            }
            collection.removeAt(index);
        }
    };
}

function useFeatureTemplates(): FeatureTemplate[] {
    return useMemo(() => {
        return LAYER_CONFIG.map(({ id, template }) => ({ layerId: id, ...template }));
    }, []);
}

function createCollections(): Map<string, Collection<Feature>> {
    return new Map(LAYER_CONFIG.map(({ id }) => [id, new Collection<Feature>()]));
}

function createVectorLayers(
    mapModel: MapModel,
    layerFactory: LayerFactory,
    collections: Map<string, Collection<Feature>>
): Layer[] {
    return [...LAYER_CONFIG].reverse().map(({ id, title, style }) => {
        const collection = collections.get(id);
        if (!collection) {
            throw new Error(`No collection found for layer '${id}'.`);
        }
        const layer = layerFactory.create({
            id,
            title,
            type: SimpleLayer,
            visible: true,
            olLayer: new VectorLayer({
                source: new VectorSource({
                    features: collection
                }),
                style,
                updateWhileAnimating: true,
                updateWhileInteracting: true
            })
        });
        mapModel.layers.addLayer(layer);
        return layer;
    });
}
