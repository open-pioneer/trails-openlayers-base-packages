// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapModel } from "@open-pioneer/map";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { TocViewModel, TocWidgetOptions } from "../model/TocViewModel";
import { TocProps } from "./Toc";

export function useTocViewModel(map: MapModel, tocProps: TocProps): TocViewModel | undefined {
    const [viewModel, setViewModel] = useState<TocViewModel>();

    const getLatestOptions = useEffectEvent(() => options);
    useEffect(() => {
        const vm = new TocViewModel(map, getLatestOptions());
        setViewModel(vm);
        return () => {
            setViewModel(undefined);
            vm.destroy();
        };
    }, [map]);

    const options = useTocOptions(tocProps);
    useEffect(() => {
        viewModel?.setOptions(options);
    }, [viewModel, options]);

    return viewModel;
}

type TocOptionProps = Pick<
    TocProps,
    "autoShowParents" | "collapsibleGroups" | "initiallyCollapsed"
>;

function useTocOptions(props: TocOptionProps): TocWidgetOptions {
    const { autoShowParents, collapsibleGroups, initiallyCollapsed } = props;
    return useMemo(
        () => createTocOptions({ autoShowParents, collapsibleGroups, initiallyCollapsed }),
        [autoShowParents, collapsibleGroups, initiallyCollapsed]
    );
}

function createTocOptions(props: TocOptionProps): TocWidgetOptions {
    return {
        autoShowParents: props.autoShowParents ?? true,
        collapsibleGroups: props.collapsibleGroups ?? props.initiallyCollapsed ?? false,
        initiallyCollapsed: props.initiallyCollapsed ?? false
    };
}
