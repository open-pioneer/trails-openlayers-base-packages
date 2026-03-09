// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { Editor, type FeatureTemplate } from "@open-pioneer/editing-form";
import { useMemo, type ReactElement } from "react";
import { LAYER_CONFIG } from "../map/layerConfig";
import { InMemoryEditingStorage as InMemoryEditingStorage } from "../store/InMemoryEditingStorage";

export function EditingComponent(): ReactElement | undefined {
    const storage = useMemo(() => new InMemoryEditingStorage(), []);
    const templates = useFeatureTemplates();

    return (
        <Box
            width={380}
            height={570}
            padding={4}
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
        >
            <Editor templates={templates} storage={storage} successNotifierDisplayDuration={2000} />
        </Box>
    );
}

function useFeatureTemplates(): FeatureTemplate[] {
    return useMemo(() => {
        return LAYER_CONFIG.map(({ id, template }) => ({ layerId: id, ...template }));
    }, []);
}
