// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, Span, Table, Text } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import type { ReactElement, ReactNode } from "react";
import { PiCircleBold, PiDotOutlineBold, PiLineSegmentsFill, PiPolygonFill } from "react-icons/pi";
import type { FeatureTemplate } from "../../../api/model/FeatureTemplate";

interface TemplateItemProps {
    readonly template: FeatureTemplate;
    readonly isSelected: boolean;
    readonly onClick: (featureTemplate: FeatureTemplate) => void;
}

interface TemplateIconProps {
    readonly template: FeatureTemplate;
}

export function TemplateItem({ template, isSelected, onClick }: TemplateItemProps): ReactElement {
    const onRowClick = useEvent(() => onClick(template));

    return (
        <Table.Row
            height="45px"
            cursor="pointer"
            bg={isSelected ? "trails.400" : "white"}
            _hover={{ bg: isSelected ? "trails.300" : "trails.100" }}
            _active={{ bg: "trails.500" }}
            onClick={onRowClick}
        >
            <Table.Cell>
                <HStack className="editor__template-selector-item" gap="4">
                    <Span aria-hidden="true">
                        <TemplateIcon template={template} />
                    </Span>
                    <Text>{template.name}</Text>
                </HStack>
            </Table.Cell>
        </Table.Row>
    );
}

// Render the icon provided for the template, or a default one if it is 'undefined'. Do not render
// anything if the icon is 'null'.
function TemplateIcon({ template }: TemplateIconProps): ReactNode | undefined {
    if (template.icon !== undefined) {
        return template.icon;
    }

    switch (template.geometryType) {
        case "Polygon":
            return <PiPolygonFill size={20} />;
        case "Circle":
            return <PiCircleBold size={20} />;
        case "LineString":
            return <PiLineSegmentsFill size={20} />;
        case "Point":
            return <PiDotOutlineBold size={20} />;
        default:
            return undefined;
    }
}
