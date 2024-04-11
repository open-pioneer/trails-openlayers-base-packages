// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    Container,
    HStack,
    ListItem,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
    UnorderedList,
    VStack
} from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <>
            <Container p={5}>
                <HStack>
                    {makeMenu({ title: "Closes on select", closeOnSelect: true })}
                    {makeMenu({ title: "Does not close on select", closeOnSelect: false })}
                </HStack>
                <VStack mt={5} align="start" spacing={2}>
                    <Text as="b">Description</Text>
                    <Text>
                        This application is used to test Chakra-UI menus inside a Shadow DOM.
                        Patches against Chakra{"'"}s <code>Menu</code> component and{" "}
                        <code>useOutsideClick()</code> hooks ensure that the component behaves as
                        expected:
                    </Text>
                    <UnorderedList>
                        <ListItem>
                            Both menu buttons should behave normally when clicking them multiple
                            times (first click on button opens menu; second click hides it again).
                        </ListItem>
                        <ListItem>Both menus close when the user clicks outside.</ListItem>
                        <ListItem>
                            The first menu should close by itself if some menu item is clicked.
                        </ListItem>
                        <ListItem>
                            The second menu should <em>not</em> close itself if an item is clicked.
                        </ListItem>
                    </UnorderedList>
                </VStack>
            </Container>
        </>
    );
}

function makeMenu(options: { title: string; closeOnSelect?: boolean }) {
    const onClose = () => {
        // eslint-disable-next-line no-debugger
        // debugger;
    };

    return (
        <Menu closeOnSelect={options.closeOnSelect ?? true} onClose={onClose}>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                {options.title}
            </MenuButton>
            <MenuList>
                <MenuItem>Download</MenuItem>
                <MenuItem>Create a Copy</MenuItem>
                <MenuItem>Mark as Draft</MenuItem>
                <MenuItem>Delete</MenuItem>
                <MenuItem>Attend a Workshop</MenuItem>
            </MenuList>
        </Menu>
    );
}
