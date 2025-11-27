// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Table, TableContainer, Tbody } from "@chakra-ui/react";
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
        <TableContainer>
            <Table variant="simple" size="sm">
                <Tbody>
                    {templates.map((template) => (
                        <TemplateRow
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplate === template}
                            onClick={onClick}
                        />
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
}

interface TemplateSelectorProps {
    readonly templates: FeatureTemplate[];
    readonly selectedTemplate: FeatureTemplate | undefined;
    readonly onClick: Callback<FeatureTemplate>;
}
