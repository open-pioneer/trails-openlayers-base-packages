// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Heading } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { useCallback, useState, type ReactElement } from "react";

import { ActionBar } from "./ActionBar";
import { SelectButton } from "./SelectButton";
import { TemplateSelector } from "./TemplateSelector";

import type { Action } from "../../model/Action";
import type { FeatureTemplate } from "../../model/FeatureTemplate";
import type { EditingState } from "../../model/EditingState";

export function ActionSelector({
    templates,
    showActionBar,
    editingState,
    onActionChange
}: ActionSelectorProps): ReactElement {
    const [selectButtonIsActive, setSelectButtonActive] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FeatureTemplate>();

    const { formatMessage } = useIntl();

    const onButtonClick = useCallback(() => {
        setSelectButtonActive((active) => !active);
        setSelectedTemplate(undefined);
        onActionChange(!selectButtonIsActive ? { type: "update" } : undefined);
    }, [selectButtonIsActive, onActionChange]);

    const onTemplateClick = useCallback(
        (newTemplate: FeatureTemplate) => {
            setSelectedTemplate((template) => (template !== newTemplate ? newTemplate : undefined));
            setSelectButtonActive(false);
            onActionChange(
                selectedTemplate !== newTemplate
                    ? { type: "create", template: newTemplate }
                    : undefined
            );
        },
        [selectedTemplate, onActionChange]
    );

    return (
        <Flex direction="column" height="full" rowGap={3} align="stretch">
            <Heading size="sm">
                {formatMessage({ id: "actionSelector.editFeatureHeading" })}
            </Heading>
            <SelectButton isActive={selectButtonIsActive} onClick={onButtonClick} />
            <Heading size="sm" mt={3}>
                {formatMessage({ id: "actionSelector.createFeatureHeading" })}
            </Heading>
            <Box flex={1} overflowY="auto" mb={2}>
                <TemplateSelector
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onClick={onTemplateClick}
                />
            </Box>
            {showActionBar && shouldShowActionBar(selectedTemplate) && (
                <ActionBar editingState={editingState} />
            )}
        </Flex>
    );
}

function shouldShowActionBar(template: FeatureTemplate | undefined): boolean {
    return template != null && ACTION_GEOMETRY_TYPES.has(template.geometryType);
}

const ACTION_GEOMETRY_TYPES = new Set<GeometryType>(["Polygon", "LineString"]);

interface ActionSelectorProps {
    readonly templates: FeatureTemplate[];
    readonly showActionBar: boolean;
    readonly editingState: EditingState;
    readonly onActionChange: (newAction: Action | undefined) => void;
}
