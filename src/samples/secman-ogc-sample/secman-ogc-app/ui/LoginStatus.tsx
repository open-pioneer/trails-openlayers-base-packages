// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Code, Flex, Text } from "@chakra-ui/react";
import { AuthService } from "@open-pioneer/authentication";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useService } from "open-pioneer:react-hooks";

export function LoginStatus() {
    const authService = useService<AuthService>("authentication.AuthService");
    const authState = useReactiveSnapshot(() => authService.getAuthState(), [authService]);

    const sessionInfo = authState.kind === "authenticated" ? authState.sessionInfo : undefined;
    if (!sessionInfo) {
        return null;
    }

    const userName = sessionInfo.userName ?? sessionInfo.userId;
    return (
        <Flex direction="row" justifyContent="center" gap={2} my={2}>
            <Text as="span">
                Logged in as <Code>{userName}</Code>
            </Text>
        </Flex>
    );
}
