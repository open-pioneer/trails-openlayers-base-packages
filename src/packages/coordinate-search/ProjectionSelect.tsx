// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { AriaLiveMessages, AriaOnChange, AriaOnFocus, Select } from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { KeyboardEvent, memo, useMemo, useState } from "react";
import { ProjectionItem } from "./CoordinateInput";

export const ProjectionSelect = memo(function ProjectionSelect(props: {
    currentProjection: ProjectionItem;
    projections: ProjectionItem[];
    portalElement: React.RefObject<HTMLDivElement>;
    onProjectionChange: (proj: ProjectionItem) => void;
}) {
    const { currentProjection, projections, portalElement, onProjectionChange } = props;
    const intl = useIntl();
    const ariaMessages = useAriaMessages(intl);
    const [isOpen, setIsOpen] = useState(false);

    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        // if the menu is already open, do nothing
        if (!isOpen && event.key === "Enter") {
            setIsOpen(true);
        }
    });

    return (
        <Select<ProjectionItem>
            value={currentProjection}
            defaultValue={currentProjection}
            options={projections}
            menuPlacement="auto"
            menuPortalTarget={portalElement.current}
            aria-label={intl.formatMessage({
                id: "coordinateInput.ariaLabel"
            })}
            classNamePrefix="coordinate-input-select"
            isSearchable={false}
            chakraStyles={{
                menu: (base) => {
                    return {
                        ...base,
                        width: "max-content",
                        minWidth: "100%"
                    };
                },
                control: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    width: "max-content",
                    minWidth: "100%",
                    color: "white",
                    borderLeftStyle: "none",
                    borderLeftRadius: 0,
                    padding: 0,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`,
                    _focus: {
                        boxShadow: "var(--chakra-shadows-outline)"
                    }
                }),
                valueContainer: (base) => ({
                    ...base,
                    paddingEnd: 0,
                    cursor: "pointer"
                }),
                dropdownIndicator: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    paddingStart: 0,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                }),
                option: (base) => ({
                    ...base,
                    _focus: {
                        background: "var(--chakra-colors-trails-300)"
                    }
                }),
                indicatorSeparator: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`,
                    borderColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                })
            }}
            ariaLiveMessages={ariaMessages}
            onChange={(e) => {
                if (e?.value !== undefined) {
                    onProjectionChange(e);
                }
            }}
            onKeyDown={keyDown}
            menuIsOpen={isOpen}
            onMenuOpen={() => setIsOpen(true)}
            onMenuClose={() => setIsOpen(false)}
        />
    );
});

/**
 * Provides custom aria messages for select of the coordinate input component.
 */
function useAriaMessages(
    intl: PackageIntl
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AriaLiveMessages<any, false, any> {
    return useMemo(() => {
        /**
         * Method to create Aria-String for focus-Event
         */
        const onFocus: AriaOnFocus<unknown> = () => {
            // no aria string for focus-events because in some screen readers (NVDA) and browsers (Chrome) updating the aria string causes the instructions to be read out again each time a select option is focused
            return "";
        };

        /**
         * Method to create Aria-String for value-change-Event
         */
        const onChange: AriaOnChange<unknown, boolean> = (props) => {
            if (props.action == "select-option" || props.action == "initial-input-focus")
                return props.label + " " + intl.formatMessage({ id: "selected" });
            else return "";
        };

        /**
         * Method to create Aria-String for instruction
         */
        const guidance = () => {
            return "";
        };

        /**
         * Method to create Aria-String for result length
         */
        const onFilter = () => {
            return "";
        };

        return {
            onFocus,
            onChange,
            guidance,
            onFilter
        };
    }, [intl]);
}
