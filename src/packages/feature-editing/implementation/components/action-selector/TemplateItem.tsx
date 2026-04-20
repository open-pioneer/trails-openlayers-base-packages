// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, Span, Table, Text } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useId, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
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
    const templateNameId = useId();
    const onRowClick = useEvent(() => onClick(template));
    const onRowKeyDown = useEvent((event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick(template);
        }
    });

    return (
        <Table.Row
            height="45px"
            cursor="pointer"
            tabIndex={0}
            aria-selected={isSelected}
            aria-labelledby={templateNameId}
            role={"option"}
            bg={isSelected ? "trails.400" : "white"}
            _hover={{ bg: isSelected ? "trails.300" : "trails.100" }}
            _active={{ bg: "trails.500" }}
            _focusVisible={{
                outline: "2px solid",
                outlineColor: "trails.500",
                outlineOffset: "-2px"
            }}
            onClick={onRowClick}
            onKeyDown={onRowKeyDown}
        >
            <Table.Cell>
                <HStack className="editor__template-selector-item" gap="4">
                    <Span aria-hidden="true">
                        <TemplateIcon template={template} />
                    </Span>
                    <Text id={templateNameId}>{template.name}</Text>
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
