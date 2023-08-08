// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    Alert,
    AlertIcon,
    AlertTitle,
    Button,
    Container,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    VStack
} from "@open-pioneer/chakra-integration";
import { useState } from "react";

interface LoginMaskProps {
    doLogin: (userName: string, password: string) => string | undefined;
}

export function LoginMask({ doLogin }: LoginMaskProps) {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const onLoginClicked = () => {
        const errorMessage = doLogin(userName, password);
        setErrorMessage(errorMessage || "");
    };

    return (
        <Container p={5}>
            <VStack spacing={4}>
                <Heading as="h1" textAlign="center">
                    Login
                </Heading>
                <Text textAlign="center">
                    Please enter your user name and password to authenticate.
                </Text>
                {errorMessage && (
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle>{errorMessage}</AlertTitle>
                    </Alert>
                )}
                <Input
                    placeholder="User name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
                <InputGroup size="md">
                    <Input
                        pr="4.5rem"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputRightElement width="4.5rem">
                        <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
                <Button onClick={onLoginClicked}>Login</Button>
            </VStack>
        </Container>
    );
}
