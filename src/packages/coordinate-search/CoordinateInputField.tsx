// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseIcon, CopyIcon } from "@chakra-ui/icons";
import {
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";

export function CoordinateInputField(props: {
    isInputValid: boolean;
    coordinateSearchInput: string;
    setCoordinateSearchInput: (searchInput: string) => void;
    placeholder: string | Coordinate;
    placeholderString: string;
    onClear: (() => void) | undefined;
    onEnter: () => void;
}) {
    const {
        isInputValid,
        coordinateSearchInput,
        setCoordinateSearchInput,
        placeholder,
        placeholderString,
        onClear,
        onEnter
    } = props;
    const intl = useIntl();

    const leftInput = (
        <Input
            type="text"
            value={coordinateSearchInput}
            onChange={(e) => {
                setCoordinateSearchInput(e.target.value);
            }}
            isInvalid={!isInputValid}
            backgroundColor={!isInputValid ? "red.100" : "undefined"}
            placeholder={placeholderString}
            errorBorderColor="red.500"
            aria-label={intl.formatMessage({
                id: "coordinateInput.ariaLabel"
            })}
            borderRightRadius={0}
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    onEnter();
                }
            }}
        />
    );

    let rightButton = null;
    if (coordinateSearchInput !== "") {
        rightButton = (
            <RightButton
                className="coordinate-input-clear-button"
                label={intl.formatMessage({
                    id: "coordinateInput.clearPlaceholder"
                })}
                onClick={() => {
                    setCoordinateSearchInput("");
                    onClear?.();
                }}
                icon={<CloseIcon />}
            />
        );
    } else if (typeof placeholder === "object") {
        rightButton = (
            <RightButton
                className="coordinate-input-copy-button"
                label={intl.formatMessage({
                    id: "coordinateInput.copyPlaceholder"
                })}
                onClick={() => {
                    navigator.clipboard.writeText(placeholderString);
                }}
                icon={<CopyIcon />}
            />
        );
    }
    return (
        <InputGroup className="coordinate-input-field-group">
            {leftInput}
            {rightButton}
        </InputGroup>
    );
}

function RightButton(props: {
    className: string;
    label: string;
    onClick: () => void;
    icon: JSX.Element;
}) {
    const { className, label, onClick, icon } = props;
    return (
        <InputRightElement>
            <Tooltip label={label}>
                <IconButton
                    className={className}
                    size="sm"
                    onClick={onClick}
                    padding={0}
                    icon={icon}
                    aria-label={label}
                />
            </Tooltip>
        </InputRightElement>
    );
}
