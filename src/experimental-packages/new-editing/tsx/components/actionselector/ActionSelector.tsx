// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Heading } from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { useCallback, useState, type ReactElement } from "react";

import { ActionBar, type ActionBarProps } from "./ActionBar";
import { SelectButton } from "./SelectButton";
import { TemplateSelector } from "./TemplateSelector";
import type { Action } from "../../model/Action";
import type { FeatureTemplate } from "../../model/FeatureTemplate";
import type { Callback } from "../../types/types";

export function ActionSelector({
    templates,
    showActionBar,
    onActionChange,
    ...actionBarProps
}: ActionSelectorProps): ReactElement {
    const [selectButtonIsActive, setSelectButtonActive] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FeatureTemplate>();

    const { formatMessage } = useIntl();

    const onButtonClick = useCallback(() => {
        setSelectButtonActive((active) => !active);
        setSelectedTemplate(undefined);
        onActionChange(!selectButtonIsActive ? "select" : undefined);
    }, [selectButtonIsActive, onActionChange]);

    const onTemplateClick = useCallback(
        (newTemplate: FeatureTemplate) => {
            setSelectedTemplate((template) => (template !== newTemplate ? newTemplate : undefined));
            setSelectButtonActive(false);
            onActionChange(selectedTemplate !== newTemplate ? newTemplate : undefined);
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
                <ActionBar {...actionBarProps} />
            )}
        </Flex>
    );
}

function shouldShowActionBar(template: FeatureTemplate | undefined): boolean {
    return template != null && ACTION_GEOMETRY_TYPES.includes(template.geometryType);
}

const ACTION_GEOMETRY_TYPES: GeometryType[] = ["Polygon", "LineString"];

interface ActionSelectorProps extends ActionBarProps {
    readonly templates: FeatureTemplate[];
    readonly showActionBar: boolean;
    readonly onActionChange: Callback<Action | undefined>;
}
