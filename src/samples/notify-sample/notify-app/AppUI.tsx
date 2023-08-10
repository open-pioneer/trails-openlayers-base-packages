// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    ButtonGroup,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Stack,
    Text,
    Textarea
} from "@open-pioneer/chakra-integration";
import { NotificationLevel, NotificationOptions, Notifier } from "@open-pioneer/notifier";
import { useService } from "open-pioneer:react-hooks";
import { useState } from "react";

export function AppUI() {
    const notifications = useService("notifier.NotificationService");
    const [title, setTitle] = useState("");
    const [level, setLevel] = useState("info");
    const [message, setMessage] = useState("");
    const emitNotification = () => {
        const options: NotificationOptions = {
            title,
            level: level as NotificationLevel, // quick and dirty, we only allow supported strings in select
            message: message
        };
        if (!options.title) {
            notifications.notify({
                title: "Title is required",
                level: "error"
            });
            return;
        }

        notifications.notify(options);
    };
    const clearNotifications = () => {
        notifications.clearAll();
    };

    return (
        <>
            <Notifier position="top-right" />
            <Container p={5}>
                <Stack spacing={8}>
                    <Stack align="center">
                        <Heading as="h1">Notify Sample</Heading>
                        <Text>Use the form below to emit notifications.</Text>
                    </Stack>
                    <Box rounded="lg" boxShadow="lg" p={8}>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Title</FormLabel>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Level</FormLabel>
                                <Select
                                    value={level}
                                    onChange={(e) => {
                                        setLevel(e.target.value);
                                    }}
                                >
                                    <option value="success">Success</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="error">Error</option>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Message</FormLabel>
                                <Textarea
                                    placeholder="Enter additional message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </FormControl>
                            <ButtonGroup justifyContent="center">
                                <Button flex="1" colorScheme="blue" onClick={emitNotification}>
                                    Emit Notification
                                </Button>
                                <Button flex="1" onClick={clearNotifications}>
                                    Clear notifications
                                </Button>
                            </ButtonGroup>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}
