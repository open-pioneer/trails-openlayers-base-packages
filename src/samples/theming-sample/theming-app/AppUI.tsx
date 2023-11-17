// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Link,
    Tooltip,
    Stack,
    Radio,
    Divider,
    Input,
    InputGroup,
    InputLeftAddon,
    Checkbox,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Textarea,
    Switch,
    Heading,
    Select,
    Flex,
    Container
} from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <Container>
            <Heading size={"md"} py={2}>
                Demo page based on color scheme &quot;trails&quot;
            </Heading>
            <Flex justifyContent={"center"}>
                <Box
                    bg="white"
                    borderWidth="1px"
                    borderRadius="lg"
                    padding={2}
                    boxShadow="lg"
                    margin={3}
                    minW={"400px"}
                >
                    <Heading size={"md"}>Button</Heading>
                    <Heading size={"xs"}>default with tooltip</Heading>
                    <Stack direction="row" my={2}>
                        <Tooltip label="Default button" placement="auto" openDelay={500}>
                            <Button>default</Button>
                        </Tooltip>
                    </Stack>

                    <Heading size={"xs"}>existing variants</Heading>
                    <Stack direction="row" my={2}>
                        <Button variant="solid">solid</Button>
                        <Button variant="outline">outline</Button>
                        <Button variant="ghost">ghost</Button>
                        <Button variant="link">link</Button>
                    </Stack>

                    <Heading size={"xs"}>custom variants</Heading>
                    <Stack direction="row" my={2}>
                        <Button variant="primary">primary</Button>
                        <Button variant="secondary">secondary</Button>
                        <Button variant="cancel">cancel</Button>
                    </Stack>

                    <Heading size={"xs"}>Button states</Heading>
                    <Stack direction="row" my={2}>
                        <Button isDisabled>isDisabled</Button>
                        <Button isActive>isActive</Button>
                        <Button isLoading>isLoading</Button>
                        <Button isLoading loadingText="loading...">
                            isLoading with text
                        </Button>
                    </Stack>

                    <Heading size={"xs"}>colorScheme</Heading>
                    <Stack direction="row" my={2}>
                        <Button colorScheme="blue">blue</Button>
                        <Button colorScheme="red">red</Button>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Checkbox</Heading>
                    <Stack direction="column" my={2} spacing={1}>
                        <Checkbox defaultChecked>defaultChecked1</Checkbox>
                        <Checkbox defaultChecked>defaultChecked2</Checkbox>
                        <Checkbox isDisabled>isDisabled</Checkbox>
                        <Checkbox isInvalid>isInvalid</Checkbox>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Input</Heading>
                    <Stack direction="column" my={2}>
                        <Input isInvalid={false} placeholder="outline (default)"></Input>
                        <Input variant={"filled"} placeholder="filled"></Input>
                        <InputGroup>
                            <InputLeftAddon />
                            <Input placeholder="input with left addon" />
                        </InputGroup>
                    </Stack>
                </Box>
                <Box
                    bg="white"
                    borderWidth="1px"
                    borderRadius="lg"
                    padding={2}
                    boxShadow="lg"
                    margin={3}
                    minW={"400px"}
                >
                    <Heading size={"md"}>Link</Heading>
                    <Stack direction="column" my={2}>
                        <Link href="https://github.com/open-pioneer" target="_blank">
                            https://github.com/open-pioneer
                        </Link>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Radio</Heading>
                    <Stack direction="column" my={2} spacing={1}>
                        <Radio defaultChecked>defaultChecked</Radio>
                        <Radio isDisabled>isDisabled</Radio>
                        <Radio isInvalid>isInvalid</Radio>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Select</Heading>
                    <Stack direction="column" my={2}>
                        <Select>
                            <option value="option1">outline1 (default)</option>
                            <option value="option2">outline2 (default)</option>
                        </Select>
                        <Select variant={"filled"}>
                            <option value="option1">filled1</option>
                            <option value="option2">filled2</option>
                        </Select>
                        <Select isDisabled>
                            <option value="option1">isDisabled</option>
                        </Select>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Slider</Heading>
                    <Stack direction="column" my={2}>
                        <Slider aria-label="slider-ex-1" defaultValue={30}>
                            <SliderTrack>
                                <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                        </Slider>
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Switch</Heading>
                    <Stack direction="column" my={2}>
                        <Switch isChecked />
                    </Stack>

                    <Divider my={5} />

                    <Heading size={"md"}>Textarea</Heading>
                    <Stack direction="column" my={2}>
                        <Textarea placeholder="Here is a sample placeholder" />
                    </Stack>
                </Box>
            </Flex>
        </Container>
    );
}
