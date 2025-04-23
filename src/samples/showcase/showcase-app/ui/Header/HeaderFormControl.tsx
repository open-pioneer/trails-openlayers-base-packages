// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Field, HStack } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface HeaderFormControlProps {
    label: string;
    children: ReactNode;
}

export function HeaderFormControl({ label, children }: HeaderFormControlProps) {
    return (
        <Field.Root asChild>
            <HStack
                maxWidth={{
                    base: "none",
                    md: "20em"
                }}
                width={{
                    base: "100%",
                    sm: "47%", // 50% does not work b/c of parent padding
                    md: undefined
                }}
            >
                <Field.Label flexBasis={{ base: "8em", sm: "auto" }} m={0}>
                    {label}
                </Field.Label>
                {children}
            </HStack>
        </Field.Root>
    );
}
