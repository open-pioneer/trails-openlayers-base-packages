// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { FeatureEditor, FeatureWriter, type FeatureTemplate } from "@open-pioneer/feature-editing";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useMemo, type ReactElement } from "react";
import { LAYER_CONFIG } from "../map/layerConfig";
import { InMemoryStore } from "../store/InMemoryStore";

export function EditorComponent(): ReactElement | undefined {
    const intl = useIntl();
    const title = intl.formatMessage({ id: "editor" });
    const writer = useMemo(() => createFeatureWriter(), []);
    const templates = useFeatureTemplates();

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
                    <FeatureEditor
                        templates={templates}
                        writer={writer}
                        successNotifierDisplayDuration={2000}
                    />
                </Box>
            </TitledSection>
        </Box>
    );
}

function createFeatureWriter(): FeatureWriter {
    return {
        addFeature: async ({ feature, template }) => {
            const store = InMemoryStore.get(template.layerId);
            await delay();
            store.addFeature(feature);
        },
        updateFeature: async ({ feature, layer }) => {
            const store = InMemoryStore.get(layer?.id);
            await delay();
            store.updateFeature(feature);
        },
        deleteFeature: async ({ feature, layer }) => {
            const store = InMemoryStore.get(layer?.id);
            await delay();
            store.deleteFeature(feature);
        }
    };
}

async function delay() {
    // Simulate server-side work.
    return new Promise((resolve) => setTimeout(resolve, 300));
}

function useFeatureTemplates(): FeatureTemplate[] {
    return useMemo(() => {
        return LAYER_CONFIG.map(({ id, template }) => ({ layerId: id, ...template }));
    }, []);
}
