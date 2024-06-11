// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FormControl, FormLabel, HStack } from "@open-pioneer/chakra-integration";
import { ReactNode } from "react";

export interface HeaderFormControlProps {
    label: string;
    children: ReactNode;
}

export function HeaderFormControl({ label, children }: HeaderFormControlProps) {
    return (
        <FormControl
            as={HStack}
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
            <FormLabel flexBasis={{ base: "8em", sm: "auto" }} m={0}>
                {label}
            </FormLabel>
            {children}
        </FormControl>
    );
}
