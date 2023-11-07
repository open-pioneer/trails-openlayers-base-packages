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
    Container,
    Input,
    InputGroup,
    InputLeftAddon,
    Checkbox,
    CloseButton,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Textarea,
    Switch
} from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <>
            <Container margin={3}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis omnis aliquid
                adipisci totam, est, magnam quasi fuga neque dignissimos, debitis modi fugiat
                laudantium. Voluptatibus magnam eos commodi officiis error culpa?
            </Container>
            <Container margin={3}>
                <Switch isChecked />
                <Textarea placeholder="Here is a sample placeholder" />
                <Slider aria-label="slider-ex-2" defaultValue={30}>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <CloseButton></CloseButton>
                <Radio>radio</Radio>
                <br />
                <Checkbox>meine checkbox</Checkbox>
                <Input isInvalid={false} placeholder="mein input"></Input>
                <Stack m={3}>
                    <InputGroup>
                        <InputLeftAddon />
                        <Input type="tel" placeholder="phone number" />
                    </InputGroup>
                </Stack>
            </Container>
            <Box
                bg="white"
                borderWidth="1px"
                borderRadius="lg"
                padding={2}
                boxShadow="lg"
                margin={3}
            >
                <Stack direction="row" margin={2}>
                    <Tooltip label="Default button" placement="auto" openDelay={500}>
                        <Button>default</Button>
                    </Tooltip>

                    <Button variant="primary">primary</Button>
                    <Button variant="secondary">secondary</Button>
                    <Button variant="cancel">cancel</Button>
                </Stack>
                <Stack direction="row" margin={2} spacing={1}>
                    <Button variant="solid">solid</Button>
                    <Button variant="outline">outline</Button>
                    <Button variant="ghost">ghost</Button>
                    <Button variant="link">link</Button>
                    <Button isDisabled>isDisabled</Button>
                </Stack>
                <Box margin={2}>
                    Das ist ein Link <Link>Chakra UI</Link>
                </Box>
                <Divider></Divider>
                <Box margin={2}>Das ist ein Divider</Box>
            </Box>
        </>
    );
}
