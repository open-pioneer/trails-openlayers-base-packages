// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Flex,
    ListItem,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    Stack,
    Text,
    UnorderedList,
    VStack
} from "@open-pioneer/chakra-integration";
import { BaseFeature, MapAnchor, MapContainer } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ResultList, ResultListInput } from "@open-pioneer/result-list";
import { useMemo, useState } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import { ChevronDownIcon } from "@chakra-ui/icons";

const RESULT_LIST_HEIGHT_PIXELS = 400;

export function AppUI() {
    const [displayVersion, setDisplayVersion] = useState(0);
    const [currentInput, setCurrentInput] = useState<ResultListInput>();
    const [resultListOpen, setResultListOpen] = useState(false);
    const [hideColumns, setHideColumns] = useState(false);
    const showResultList = !!currentInput && resultListOpen;
    const fillResultList = (input: ResultListInput) => {
        setCurrentInput(input);
        setResultListOpen(true);

        // Incrementing the displayVersion (used as key) drops internal result list state
        setDisplayVersion(displayVersion + 1);
    };

    // Hide certain columns to test UI state.
    const shownInput = useMemo(() => {
        if (!currentInput || !hideColumns) {
            return currentInput; // unchanged
        }

        const filteredColumns = currentInput.columns.filter((_, index) => index % 2 == 1);
        return {
            ...currentInput,
            columns: filteredColumns
        };
    }, [hideColumns, currentInput]);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Result List
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer
                        mapId={MAP_ID}
                        viewPadding={{ bottom: showResultList ? RESULT_LIST_HEIGHT_PIXELS : 0 }}
                    >
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <Stack>
                                    <Text align="center">Test Controls:</Text>
                                    <Menu placement="right-end">
                                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                            Fill result list
                                        </MenuButton>
                                        <Portal>
                                            <MenuList>
                                                <MenuItem onClick={() => fillResultList(PERSONS)}>
                                                    Persons
                                                </MenuItem>
                                                <MenuItem onClick={() => fillResultList(GENERATED)}>
                                                    Generated
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => fillResultList(LONG_STRINGS)}
                                                >
                                                    Long Strings
                                                </MenuItem>
                                                <MenuItem
                                                    onClick={() => fillResultList(MANY_COLUMS)}
                                                >
                                                    Many Columns
                                                </MenuItem>
                                            </MenuList>
                                        </Portal>
                                    </Menu>
                                    <Button onClick={() => setHideColumns(!hideColumns)}>
                                        {hideColumns ? "Show" : "Hide"} even columns
                                    </Button>
                                    <Button
                                        isDisabled={currentInput === undefined}
                                        onClick={() => setResultListOpen(true)}
                                    >
                                        Show result list
                                    </Button>
                                    <Button onClick={() => setResultListOpen(false)}>
                                        Hide result list
                                    </Button>
                                    <Button
                                        isDisabled={currentInput === undefined}
                                        onClick={() => setCurrentInput(undefined)}
                                    >
                                        Close result list
                                    </Button>
                                </Stack>
                            </Box>
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <VStack
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                maxWidth="400px"
                                maxHeight="300px"
                                overflow="auto"
                            >
                                <Text as="b">Description</Text>
                                <Text>
                                    This application can be used to test the result list component.
                                    Internally, this application keeps track of the current result
                                    list input and displays it when the component shall be shown.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        If the result list has been filled, it can be hidden and
                                        shown again while preserving the state (selection, sort,
                                        scroll, ...).
                                    </ListItem>
                                    <ListItem>
                                        The result list is embedded with a fixed height (with
                                        internal scrolling) above the map (using view padding).
                                        Showing or hiding the component will animate the view.
                                    </ListItem>
                                    <ListItem>
                                        Toggling columns will preserve the state of the result list.
                                    </ListItem>
                                    <ListItem>
                                        Filling the result list again resets the state (even when
                                        using equal data).
                                    </ListItem>
                                    <ListItem>
                                        Fully closing the result list drops all state.
                                    </ListItem>
                                </UnorderedList>
                            </VStack>
                        </MapAnchor>
                    </MapContainer>
                    {shownInput && (
                        <Box
                            position="absolute"
                            visibility={showResultList ? "visible" : "hidden"}
                            bottom="0"
                            backgroundColor="white"
                            width="100%"
                            height={`${RESULT_LIST_HEIGHT_PIXELS}px`}
                            borderTop="2px solid"
                            borderColor="trails.500"
                            zIndex={1}
                        >
                            <ResultList key={String(displayVersion)} input={shownInput} />
                        </Box>
                    )}
                </Flex>
            </TitledSection>
        </Flex>
    );
}

let nextPersonId = 1;
function createPerson(name: string, age: number, city: string) {
    return {
        id: String(nextPersonId++),
        properties: {
            name,
            age,
            city
        }
    } satisfies BaseFeature;
}

const PERSONS: ResultListInput = {
    data: [
        createPerson("Test User A", 21, "Cologne"),
        createPerson("Test User B", 33, "Berlin"),
        createPerson("Test User C", 44, "New York"),
        createPerson("Test User D", 55, "London"),
        createPerson("Test User E", 8, "Rome"),
        createPerson("Test User F", 14, "Vienna"),
        createPerson("Test User G", 17, "Paris"),
        createPerson("Test User H", 27, "Brussels"),
        createPerson("Test User I", 19, "Warsaw")
    ],
    columns: [
        {
            // Simple computed column value
            displayName: "id",
            getPropertyValue(feature) {
                return feature.id;
            }
        },
        {
            propertyName: "name"
        },
        {
            propertyName: "age"
        },
        {
            propertyName: "city"
        }
    ]
};

const GENERATED: ResultListInput = {
    data: Array.from(Array(100).keys()).map((index): BaseFeature => {
        return {
            id: index,
            properties: {
                "boolean": index % 2 == 0,
                "empty": index % 2 == 0 ? null : undefined,
                "number": index,
                "float": index / 7.0,
                "string": `Item ${index}`,
                "date": new Date()
            }
        };
    }),
    columns: [
        {
            propertyName: "boolean"
        },
        {
            propertyName: "number"
        },
        {
            propertyName: "float"
        },
        {
            propertyName: "string"
        },
        {
            propertyName: "date"
        },
        {
            propertyName: "empty"
        }
    ],
    formatOptions: {
        formatNumberOptions: {
            maximumFractionDigits: 2
        },
        dateTimeFormatOptions: {
            timeStyle: "full",
            dateStyle: "full",
            timeZone: "UTC"
        }
    }
};

const LONG_STRINGS: ResultListInput = {
    data: [
        {
            id: 1,
            properties: {
                short: "Short 1",
                long: `LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG `
            }
        },
        {
            id: 2,
            properties: {
                short: "Short 2",
                long: `LONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONGLONG`
            }
        }
    ],
    columns: [
        {
            propertyName: "short"
        },
        {
            propertyName: "long",
            width: 300
        }
    ]
};

const MANY_COLUMS: ResultListInput = {
    columns: [
        {
            propertyName: "a"
        },
        {
            propertyName: "b"
        },
        {
            propertyName: "c"
        },
        {
            propertyName: "d"
        },
        {
            propertyName: "e"
        },
        {
            propertyName: "f"
        },
        {
            propertyName: "g"
        },
        {
            propertyName: "h"
        },
        {
            propertyName: "i"
        }
    ],
    data: [
        {
            id: 0,
            properties: {
                a: 1,
                b: 1,
                c: 1,
                d: 1,
                e: 1,
                f: 1,
                g: 1,
                h: 1,
                i: 1
            }
        }
    ]
};