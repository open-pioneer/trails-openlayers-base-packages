// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Heading } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import {
    Editor,
    FeatureTemplate,
    type OnEditingStepChange,
    type FieldInputsProvider
} from "new-editing";

import { LAYER_CONFIG } from "../map/layerConfig";
import { InMemoryEditingHandler } from "../store/InMemoryEditingHandler";

export function EditingComponent(): ReactElement | undefined {
    const editingHandler = useMemo(() => new InMemoryEditingHandler(), []);
    const templates = useFeatureTemplates();
    const editableLayerIds = useMemo(() => templates.map(({ id }) => id), [templates]);
    const fieldInputsProvider = useFieldInputsProvider(templates);
    const [title, updateTitle] = useTitle();

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
                        templates={templates}
                        editableLayerIds={editableLayerIds}
                        fieldInputsProvider={fieldInputsProvider}
                        editingHandler={editingHandler}
                        onEditingStepChange={updateTitle}
                    />
                </Box>
            </Flex>
        </Box>
    );
}

function useFeatureTemplates(): FeatureTemplate[] {
    return useMemo(() => LAYER_CONFIG.map(({ id, template }) => ({ id, ...template })), []);
}

// TODO: Simplify the API for this common use case.
// TODO: EditingHandler should also directly be passed an ID.
// TODO: Perhaps the creation workflow step should have a layer instance.
function useFieldInputsProvider(templates: FeatureTemplate[]): FieldInputsProvider {
    return useMemo(
        () => ({
            getFieldInputsForExistingFeature(_, olLayer) {
                const layerId = olLayer?.get("id");
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
            const layerTitle = editingStep.olLayer?.get("title");
            setTitle(layerTitle);
        } else {
            setTitle(undefined);
        }
    }, []);

    return [title ?? defaultTitle, updateTitle];
}
