// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Button,
    FormControl,
    FormLabel,
    Tooltip,
    Container
} from "@open-pioneer/chakra-integration";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { Geometry } from "ol/geom";
import { PiUserRectangle } from "react-icons/pi";
import { useIntl } from "open-pioneer:react-hooks";
import { FakePointSelectionSource } from "./testSources";
import { SelectionSource } from "./api";
import { PackageIntl } from "@open-pioneer/runtime/i18n";
import { DragController } from "./DragController";
import { Select, OptionProps, chakraComponents } from "chakra-react-select";
import { FiAlertTriangle } from "react-icons/fi";
import { SelectionController } from "./SelectionController";

/**
 * Properties supported by the {@link Selection} component.
 */
export interface SelectionProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
    /**
     * Array of source labels
     */
    sourceLabel: string[];

    /**
     * Is Tool active
     */
    activeState: boolean;
}

/**
 * Properties for single select options.
 */
export interface SelectOption {
    /**
     * The label of the select option.
     */
    label: string;

    /**
     * The value (SelectionSource) of the select option.
     */
    value: SelectionSource | undefined;
}

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId, sourceLabel, activeState } = props;
    const { containerProps } = useCommonComponentProps("selection", props);

    const sources: SelectionSource[] = useMemo(() => [new FakePointSelectionSource(2000)], []);
    const [source, setSource] = useState("");
    const mapState = useMapModel(mapId);
    const { onInputChanged } = useSelectionController(mapState.map, sources);
    const controller = useDragController(mapState.map, intl, onInputChanged);

    useEffect(() => {
        if (!activeState) controller?.destroy();
    }, [activeState, controller]);

    /* if (sourceLabel) {
        const fakeSource = [new FakePointSelectionSource(5000)];
        if (sourceLabel.includes(fakeSource.label)) {
            sources = [fakeSource];
        }
    } */
    const options: SelectOption[] = sources.map<SelectOption>((source) => {
        return { label: source.label, value: source };
    });

    return (
        <Container mb={16}>
            <Button isActive={true} leftIcon={<PiUserRectangle />}>
                {intl.formatMessage({ id: "rectangle" })}
            </Button>
            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select
                    name="select-source"
                    options={options}
                    components={{ Option: SourceSelectOption }}
                    isOptionDisabled={(option) => option?.value?.status === "unavailable"}
                />
            </FormControl>
        </Container>
    );
};

function SourceSelectOption(props: OptionProps<SelectOption>): JSX.Element {
    const { value } = props.data;
    const intl = useIntl();
    // TODO: Label not working
    const notAvailableLabel: string | undefined = intl.formatMessage({ id: "sourceNotAvailable" });
    const label: string | undefined = value?.label;
    const isAvailable: boolean | undefined = value?.status === "available";

    return (
        <chakraComponents.Option {...props} isDisabled={!isAvailable}>
            {label}
            &nbsp;
            {!isAvailable && (
                <Tooltip label={notAvailableLabel} placement="right" openDelay={500}>
                    <span>
                        <FiAlertTriangle color={"red"} aria-label={notAvailableLabel} />
                    </span>
                </Tooltip>
            )}
        </chakraComponents.Option>
    );
}

function useDragController(
    map: MapModel | undefined,
    intl: PackageIntl,
    extendHandler: (geometry: Geometry) => void
) {
    const [controller, setController] = useState<DragController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new DragController(
            map.olMap,
            intl.formatMessage({ id: "tooltip" }),
            extendHandler
        );
        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, intl, extendHandler]);
    return controller;
}

function useSelectionController(mapModel: MapModel | undefined, sources: SelectionSource[]) {
    const [controller, setController] = useState<SelectionController | undefined>(undefined);
    useEffect(() => {
        if (!mapModel) {
            return;
        }
        const controller = new SelectionController(mapModel, sources);

        setController(controller);
        //TODO dependency sources leads to infinite-Render-Loop
    }, [mapModel, sources]);

    const onInputChanged = useCallback(
        async (geometry: Geometry) => {
            const selectionResult = await controller?.select(geometry.getExtent());
            if (selectionResult) {
                alert(
                    selectionResult?.[0]?.source?.label +
                        ": " +
                        selectionResult?.[0]?.results.length
                );
            }
        },
        [controller]
    );
    return {
        controller,
        onInputChanged
    };
}
