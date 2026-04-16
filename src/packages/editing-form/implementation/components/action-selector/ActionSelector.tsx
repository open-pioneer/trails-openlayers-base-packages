// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@chakra-ui/react";
import { TitledSection, useEvent } from "@open-pioneer/react-utils";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { useIntl } from "open-pioneer:react-hooks";
import { useMemo, useState, type ReactElement } from "react";
import type { FeatureTemplate } from "../../../api/model/FeatureTemplate";
import { DrawingState } from "../../geometry-editing/useGeometryEditing";
import { ActionBar } from "./ActionBar";
import { SelectButton } from "./SelectButton";
import { TemplateSelector } from "./TemplateSelector";

export interface ActionSelectorProps {
    readonly templates: FeatureTemplate[];
    readonly showActionBar: boolean;
    readonly drawingState: DrawingState;
    readonly onActionChange: (newAction: Action | undefined) => void;
}

export interface CreateAction {
    readonly mode: "create";
    readonly template: FeatureTemplate;
}

export interface UpdateAction {
    readonly mode: "update";
}

export type Action = CreateAction | UpdateAction;

export function ActionSelector({
    templates,
    showActionBar,
    drawingState,
    onActionChange
}: ActionSelectorProps): ReactElement {
    const [selectButtonIsActive, setSelectButtonActive] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FeatureTemplate>();

    const onButtonClick = useEvent(() => {
        setSelectButtonActive((active) => !active);
        setSelectedTemplate(undefined);
        onActionChange(!selectButtonIsActive ? { mode: "update" } : undefined);
    });

    const onTemplateClick = useEvent((template: FeatureTemplate) => {
        setSelectedTemplate((current) => (current !== template ? template : undefined));
        setSelectButtonActive(false);
        onActionChange(selectedTemplate !== template ? { mode: "create", template } : undefined);
    });

    const { formatMessage } = useIntl();

    const [editFeatureHeading, createFeatureHeading] = useMemo(
        () => [
            formatMessage({ id: "actionSelector.editFeatureHeading" }),
            formatMessage({ id: "actionSelector.createFeatureHeading" })
        ],
        [formatMessage]
    );

    return (
        <Flex direction="column" height="full" rowGap={3} align="stretch" overflowY="auto">
            <TitledSection title={editFeatureHeading} sectionHeadingProps={{ size: "sm" }}>
                <SelectButton isActive={selectButtonIsActive} onClick={onButtonClick} />
            </TitledSection>

            <TitledSection title={createFeatureHeading} sectionHeadingProps={{ size: "sm", mt: 3 }}>
                <Box flex={1} overflowY="auto" mb={2}>
                    <TemplateSelector
                        templates={templates}
                        selectedTemplate={selectedTemplate}
                        onClick={onTemplateClick}
                    />
                </Box>
                {showActionBar && shouldShowActionBar(selectedTemplate) && (
                    <ActionBar drawingState={drawingState} />
                )}
            </TitledSection>
        </Flex>
    );
}

function shouldShowActionBar(template: FeatureTemplate | undefined): boolean {
    return template != null && ACTION_GEOMETRY_TYPES.has(template.geometryType);
}

const ACTION_GEOMETRY_TYPES = new Set<GeometryType>(["Polygon", "LineString"]);
