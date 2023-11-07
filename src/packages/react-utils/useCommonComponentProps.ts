// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import classNames from "classnames";
import { HTMLAttributes } from "react";

/**
 * Common properties supported by all public react components.
 */
export interface CommonComponentProps {
    /**
     * Additional class name(s).
     */
    "className"?: string;

    /**
     * Used for testing.
     */
    "data-testid"?: string;
}

/**
 * A helper hook that computes react properties for the topmost container in a public react component.
 *
 * Example:
 *
 * ```jsx
 * function MyComponent(props) {
 *     const { containerProps } = useCommonComponentProps("my-component", props);
 *     // automatically applies css classes and testid
 *     return <Box {...containerProps}>Content</Box>;
 * }
 * ```
 */
export function useCommonComponentProps(
    componentClassName: string,
    props: CommonComponentProps
): { containerProps: HTMLAttributes<HTMLElement> } {
    const containerProps = {
        "className": classNames(componentClassName, props.className),
        "data-testid": props["data-testid"]
    };
    return {
        containerProps
    };
}
