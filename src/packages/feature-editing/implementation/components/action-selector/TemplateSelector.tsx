// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Table } from "@chakra-ui/react";
import type { ReactElement } from "react";
import { TemplateItem } from "./TemplateItem";
import type { FeatureTemplate } from "../../../api/model/FeatureTemplate";

interface TemplateSelectorProps {
    readonly templates: FeatureTemplate[];
    readonly selectedTemplate: FeatureTemplate | undefined;
    readonly onClick: (featureTemplate: FeatureTemplate) => void;
}

export function TemplateSelector({
    templates,
    selectedTemplate,
    onClick
}: TemplateSelectorProps): ReactElement {
    return (
        <Table.Root
            role="presentation" // Note: the body/rows implement a listbox pattern
            className="editor__template-selector"
            variant="line"
            size="sm"
        >
            <Table.Body role={"listbox"}>
                {templates.map((template, index) => (
                    <TemplateItem
                        key={index}
                        template={template}
                        isSelected={selectedTemplate === template}
                        onClick={onClick}
                    />
                ))}
            </Table.Body>
        </Table.Root>
    );
}
