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
    Select
} from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <>
            <Box
                bg="white"
                borderWidth="1px"
                borderRadius="lg"
                padding={2}
                boxShadow="lg"
                margin={3}
                __width={"50vw"}
            >
                <Heading size={"md"}>Buttons</Heading>
                <Heading size={"xs"}>default with tooltip</Heading>
                <Stack direction="row" margin={2}>
                    <Tooltip label="Default button" placement="auto" openDelay={500}>
                        <Button>default</Button>
                    </Tooltip>
                </Stack>

                <Heading size={"xs"}>custom variants</Heading>
                <Stack direction="row" margin={2}>
                    <Button variant="primary">primary</Button>
                    <Button variant="secondary">secondary</Button>
                    <Button variant="cancel">cancel</Button>
                </Stack>

                <Heading size={"xs"}>default variants</Heading>
                <Stack direction="row" margin={2} spacing={1}>
                    <Button variant="solid">solid</Button>
                    <Button variant="outline">outline</Button>
                    <Button variant="ghost">ghost</Button>
                    <Button variant="link">link</Button>
                </Stack>

                <Heading size={"xs"}>isDisabled</Heading>
                <Stack direction="row" margin={2} spacing={1}>
                    <Button isDisabled>isDisabled</Button>
                </Stack>

                <Heading size={"xs"}>blue colorScheme</Heading>
                <Stack direction="row" margin={2} spacing={1}>
                    <Button colorScheme="blue">blue</Button>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Checkbox</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Checkbox defaultChecked>defaultChecked1</Checkbox>
                    <Checkbox defaultChecked>defaultChecked2</Checkbox>
                    <Checkbox isDisabled>isDisabled</Checkbox>
                    <Checkbox isInvalid>isInvalid</Checkbox>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Input</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Input isInvalid={false} placeholder="placeholder"></Input>
                    <Input variant={"filled"} placeholder="placeholder"></Input>
                    <InputGroup>
                        <InputLeftAddon />
                        <Input placeholder="placeholder" />
                    </InputGroup>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Radio</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Radio defaultChecked>defaultChecked</Radio>
                    <Radio isDisabled>isDisabled</Radio>
                    <Radio isInvalid>isInvalid</Radio>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Select</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Select>
                        <option value="option1">default 1</option>
                        <option value="option2">default 2</option>
                    </Select>
                    <Select variant={"filled"}>
                        <option value="option1">filled 1</option>
                        <option value="option2">filled 2</option>
                    </Select>
                    <Select isDisabled>
                        <option value="option1">isDisabled</option>
                    </Select>
                    <Select isInvalid>
                        <option value="option1">isInvalid</option>
                    </Select>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Slider</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Slider aria-label="slider-ex-1" defaultValue={30}>
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                </Stack>

                <Heading size={"md"}>Link</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Link href="https://github.com/open-pioneer" target="_blank">
                        https://github.com/open-pioneer
                    </Link>
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Slider</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Switch isChecked />
                </Stack>

                <Divider my={5} />

                <Heading size={"md"}>Textarea</Heading>
                <Stack direction="column" margin={2} spacing={1}>
                    <Textarea placeholder="Here is a sample placeholder" />
                </Stack>
            </Box>
        </>
    );
}
