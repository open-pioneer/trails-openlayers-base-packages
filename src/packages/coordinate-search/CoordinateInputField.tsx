// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Field, Icon, IconButton, Input, InputGroup, VisuallyHidden } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";
import { FiCopy, FiX } from "react-icons/fi";

/**
 * Text input for coordinates.
 */
export function CoordinateInputField(props: {
    coordinateSearchInput: string;
    setCoordinateSearchInput: (searchInput: string) => void;
    placeholder: string | Coordinate;
    placeholderString: string;
    errorMessage: string | undefined;
    onClear: (() => void) | undefined;
    onEnter: () => void;
}) {
    const {
        errorMessage,
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
            errorMessage={errorMessage}
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
                    id: "coordinateInput.clearLabel"
                })}
                onClick={() => {
                    setCoordinateSearchInput("");
                    onClear?.();
                }}
                icon={
                    <Icon>
                        <FiX />
                    </Icon>
                }
            />
        );
    } else if (typeof placeholder === "object") {
        attachedButton = (
            <AttachedButton
                className="coordinate-input-copy-button"
                label={intl.formatMessage({
                    id: "coordinateInput.copyLabel"
                })}
                onClick={() => {
                    navigator.clipboard.writeText(placeholderString);
                }}
                icon={
                    <Icon>
                        <FiCopy />
                    </Icon>
                }
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
    value: string;
    placeholder: string;
    errorMessage: string | undefined;
    onChange: (newValue: string) => void;
    onEnter: () => void;
}) {
    const intl = useIntl();
    const { errorMessage, value, placeholder, onChange, onEnter } = props;
    const isInvalid = !!errorMessage;
    return (
        <Field.Root invalid={isInvalid} flex="1 1 auto">
            <Input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                backgroundColor={isInvalid ? "red.100" : undefined}
                placeholder={placeholder}
                aria-label={intl.formatMessage({
                    id: "coordinateInput.ariaLabel"
                })}
                borderLeftRadius={0}
                onKeyDown={(e) => {
                    if (e.key == "Enter") {
                        onEnter();
                    }
                }}
                /*avoid that browser provides old user inputs as suggestions in some edge cases*/
                autoComplete={"off"}
            />
            {/* NOTE: Tooltip shows same information, this is for screen readers only */}
            <VisuallyHidden asChild>
                <Field.ErrorText>{errorMessage}</Field.ErrorText>
            </VisuallyHidden>
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
