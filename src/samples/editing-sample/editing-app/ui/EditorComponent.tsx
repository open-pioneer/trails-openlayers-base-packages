// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { FeatureEditor, type FeatureTemplate } from "@open-pioneer/editing-form";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useMemo, type ReactElement } from "react";
import { LAYER_CONFIG } from "../map/layerConfig";
import { InMemoryFeatureWriter } from "../store/InMemoryFeatureWriter";

export function EditorComponent(): ReactElement | undefined {
    const intl = useIntl();
    const title = intl.formatMessage({ id: "editor" });
    const writer = useMemo(() => new InMemoryFeatureWriter(), []);
    const templates = useFeatureTemplates();

    return (
        <Box
            width="380px"
            height="570px"
            padding={4}
            backgroundColor="white"
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

function useFeatureTemplates(): FeatureTemplate[] {
    return useMemo(() => {
        return LAYER_CONFIG.map(({ id, template }) => ({ layerId: id, ...template }));
    }, []);
}
