// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, Td, Text, Tr } from "@open-pioneer/chakra-integration";
import {
    PiCircleBold,
    PiDotOutlineBold,
    PiDotsThreeOutlineBold,
    PiLineSegmentsFill,
    PiPolygonFill
} from "react-icons/pi";
import { useCallback, type ReactElement, type ReactNode } from "react";
import type { FeatureTemplate } from "../../model/FeatureTemplate";
import type { Callback } from "../../types/types";

export function TemplateRow({ template, isSelected, onClick }: TemplateRowProps): ReactElement {
    const onRowClick = useCallback(() => {
        onClick(template);
    }, [template, onClick]);

    return (
        <Tr
            height="45px"
            cursor="pointer"
            bg={isSelected ? "trails.400" : "white"}
            _hover={{ bg: isSelected ? "trails.300" : "trails.100" }}
            _active={{ bg: "trails.500" }}
            onClick={onRowClick}
        >
            <Td>
                <HStack spacing="4">
                    <TemplateIcon template={template} />
                    <Text>{template.name}</Text>
                </HStack>
            </Td>
        </Tr>
    );
}

function TemplateIcon({ template }: TemplateIconProps): ReactNode | undefined {
    if (template.icon === undefined) {
        switch (template.geometryType) {
            case "Polygon":
                return <PiPolygonFill size={20} />;
            case "Circle":
                return <PiCircleBold size={20} />;
            case "LineString":
                return <PiLineSegmentsFill size={20} />;
            case "Point":
                return <PiDotOutlineBold size={20} />;
            case "MultiPoint":
                return <PiDotsThreeOutlineBold size={20} />;
            default:
                return undefined;
        }
    } else {
        return template.icon ?? undefined;
    }
}

interface TemplateRowProps {
    readonly template: FeatureTemplate;
    readonly isSelected: boolean;
    readonly onClick: Callback<FeatureTemplate>;
}

interface TemplateIconProps {
    readonly template: FeatureTemplate;
}
