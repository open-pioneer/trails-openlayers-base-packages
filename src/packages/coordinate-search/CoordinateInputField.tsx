// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Field, IconButton, Input, InputGroup } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";
import { FiCopy, FiX } from "react-icons/fi";

/**
 * Text input for coordinates.
 */
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

    const inputField = (
        <InputField
            invalid={!isInputValid}
            value={coordinateSearchInput}
            placeholder={placeholderString}
            onChange={(newValue) => {
                setCoordinateSearchInput(newValue);
            }}
            onEnter={onEnter}
        />
    );

    let attachedButton = null;
    if (coordinateSearchInput !== "") {
        attachedButton = (
            <AttachedButton
                className="coordinate-input-clear-button"
                label={intl.formatMessage({
                    id: "coordinateInput.clearPlaceholder"
                })}
                onClick={() => {
                    setCoordinateSearchInput("");
                    onClear?.();
                }}
                icon={<FiX />}
            />
        );
    } else if (typeof placeholder === "object") {
        attachedButton = (
            <AttachedButton
                className="coordinate-input-copy-button"
                label={intl.formatMessage({
                    id: "coordinateInput.copyPlaceholder"
                })}
                onClick={() => {
                    navigator.clipboard.writeText(placeholderString);
                }}
                icon={<FiCopy />}
            />
        );
    }
    return (
        <InputGroup
            className="coordinate-input-field-group"
            endElement={attachedButton}
            endElementProps={{
                className: "coordinate-input-field-attachment",
                paddingInline: "4px"
            }}
        >
            {inputField}
        </InputGroup>
    );
}

function InputField(props: {
    invalid: boolean;
    value: string;
    placeholder: string;
    onChange: (newValue: string) => void;
    onEnter: () => void;
}) {
    const intl = useIntl();
    const { invalid, value, placeholder, onChange, onEnter } = props;
    return (
        <Field.Root invalid={invalid} flex="1 1 auto">
            <Input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                backgroundColor={invalid ? "red.100" : undefined}
                placeholder={placeholder}
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
        </Field.Root>
    );
}

function AttachedButton(props: {
    className: string;
    label: string;
    onClick: () => void;
    icon: React.ReactElement;
}) {
    const { className, label, onClick, icon } = props;
    return (
        <Tooltip content={label}>
            <IconButton className={className} size="xs" onClick={onClick} aria-label={label}>
                {icon}
            </IconButton>
        </Tooltip>
    );
}
