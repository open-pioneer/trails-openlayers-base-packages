// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Heading } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { Layer } from "ol/layer";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import {
    Editor,
    FeatureTemplate,
    type EditingHandler,
    type OnEditingStepChange,
    type FieldInputsProvider
} from "new-editing";

import { FEATURE_TEMPLATES } from "./featureTemplates";
import { getStore } from "./map/getStore";
import type { LayerId } from "./map/MainMapProvider";

export function EditingComponent({ isActive }: EditingComponentProps): ReactElement | undefined {
    const editingHandler = useEditingHandler();
    const fieldInputsProvider = useFieldInputsProvider(FEATURE_TEMPLATES);
    const [title, updateTitle] = useTitle();

    if (isActive) {
        return (
            <Box
                width={330}
                height={570}
                padding={4}
                backgroundColor="white"
                borderWidth="1px"
                borderRadius="lg"
                boxShadow="lg"
            >
                <Flex direction="column" height="full">
                    <Heading size="md" mb={4}>
                        {title}
                    </Heading>
                    <Box flex={1} overflowY="auto">
                        <Editor
                            templates={FEATURE_TEMPLATES}
                            editableLayerIds={EDITABLE_LAYER_IDS}
                            fieldInputsProvider={fieldInputsProvider}
                            editingHandler={editingHandler}
                            onEditingStepChange={updateTitle}
                        />
                    </Box>
                </Flex>
            </Box>
        );
    } else {
        return undefined;
    }
}

interface EditingComponentProps {
    readonly isActive: boolean;
}

function useEditingHandler(): EditingHandler {
    const refreshLayer = useRefreshLayer();

    // Simulate server-side work.
    const addArtificialDelay = useCallback(() => {
        return new Promise((resolve) => setTimeout(resolve, 300));
    }, []);

    return useMemo(
        () => ({
            async addFeature(feature, template, projection) {
                const store = getStore(template.id);
                if (store != null) {
                    await addArtificialDelay();
                    await store.addFeature(feature, projection);
                    refreshLayer(template.id);
                } else {
                    throw new Error(`No such store with ID ${template.id}`);
                }
            },

            async updateFeature(feature, layer, projection) {
                const id = layer?.get("id");
                const store = getStore(id);
                if (store != null) {
                    await addArtificialDelay();
                    await store.updateFeature(feature, projection);
                } else {
                    throw new Error(`No such store with ID ${id}`);
                }
            },

            async deleteFeature(feature, layer) {
                const id = layer?.get("id");
                const store = getStore(id);
                if (store != null) {
                    await addArtificialDelay();
                    await store.deleteFeature(feature);
                } else {
                    throw new Error(`No such store with ID ${id}`);
                }
            }
        }),
        [addArtificialDelay, refreshLayer]
    );
}

function useFieldInputsProvider(templates: FeatureTemplate[]): FieldInputsProvider {
    return useMemo(
        () => ({
            getFieldInputsForExistingFeature(_, layer) {
                const layerId = layer?.get("id");
                if (layerId != null) {
                    return templates.find(({ id }) => id === layerId)?.fieldInputs;
                } else {
                    return undefined;
                }
            }
        }),
        [templates]
    );
}

function useTitle(): [string, OnEditingStepChange] {
    const [title, setTitle] = useState<string>();

    const { formatMessage } = useIntl();
    const defaultTitle = useMemo(() => formatMessage({ id: "editingTitle" }), [formatMessage]);

    const updateTitle = useCallback<OnEditingStepChange>((editingStep) => {
        if (editingStep.id === "create-modify") {
            setTitle(editingStep.template.name);
        } else if (editingStep.id === "update-modify") {
            const layerTitle = editingStep.layer?.get("title");
            setTitle(layerTitle);
        } else {
            setTitle(undefined);
        }
    }, []);

    return [title ?? defaultTitle, updateTitle];
}

function useRefreshLayer(): (id: string) => void {
    const { map: mapModel } = useMapModel();

    return useCallback(
        (id) => {
            const layer = mapModel?.layers.getLayerById(id);
            if (layer?.type === "simple" && layer.olLayer instanceof Layer) {
                layer?.olLayer.getSource().refresh();
            }
        },
        [mapModel?.layers]
    );
}

const EDITABLE_LAYER_IDS: LayerId[] = [
    "waldschaeden",
    "waldwege",
    "schutzgebiete",
    "bodenproben",
    "aufforstungsflaechen"
];
