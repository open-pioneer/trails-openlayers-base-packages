// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Table } from "@chakra-ui/react";
import type { ReactElement } from "react";

import { TemplateRow } from "./TemplateRow";
import type { FeatureTemplate } from "../../model/FeatureTemplate";
import type { Callback } from "../../types/types";

export function TemplateSelector({
    templates,
    selectedTemplate,
    onClick
}: TemplateSelectorProps): ReactElement {
    return (
        <Table.Root variant="simple" size="sm">
            <Table.Body>
                {templates.map((template) => (
                    <TemplateRow
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate === template}
                        onClick={onClick}
                    />
                ))}
            </Table.Body>
        </Table.Root>
    );
}

interface TemplateSelectorProps {
    readonly templates: FeatureTemplate[];
    readonly selectedTemplate: FeatureTemplate | undefined;
    readonly onClick: Callback<FeatureTemplate>;
}
