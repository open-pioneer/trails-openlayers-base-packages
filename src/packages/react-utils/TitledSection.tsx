// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Heading, HeadingProps } from "@open-pioneer/chakra-integration";
import { FC, ForwardedRef, ReactNode, createContext, forwardRef, useContext } from "react";

const DEFAULT_LEVEL = 1;

const LevelContext = createContext(DEFAULT_LEVEL);
LevelContext.displayName = "LevelContext";

/** Properties of the {@link TitledSection} component. */
export interface TitledSectionProps {
    /**
     * The title component.
     *
     * Strings are automatically wrapped in a {@link SectionHeading}.
     * More complex nodes should use the {@link SectionHeading} internally.
     */
    title?: string | ReactNode | undefined;

    /**
     * Children are rendered without any modifications.
     */
    children?: ReactNode | undefined;

    /**
     * Allows to substitute the heading level that is used up from this section.
     * This should only be used to configure the initial level
     * or if it is actually intended to adjust the DOM structure.
     */
    substituteHeadingLevel?: HeadingLevel | undefined;
}

/**
 * Automatically manages the level of html headings such as `h1` and `h2`.
 *
 * Use this component's `title` property instead of manual heading tags.
 * Nested sections will automatically use the correct level for their current location.
 *
 * Titles are rendered as [Chakra Headings](https://chakra-ui.com/docs/components/heading) by default.
 *
 * Example: Simple string headings (1, 2 and 3 will be rendered as h1, h2 and h3):
 *
 * ```jsx
 * <TitledSection title="1">
 *     Top level content
 *
 *     <TitledSection title="2">
 *         Nested content
 *
 *         <TitledSection title="3">
 *             Deeply nested content
 *         </TitledSection>
 *     </TitledSection>
 * </TitledSection>
 * ```
 *
 * Example: custom title rendering
 *
 * ```jsx
 * <TitledSection
 *     title={
 *         <SectionHeading size="4xl">Heading</SectionHeading>
 *     }
 * >
 *     Content
 * </TitledSection>
 * ```
 */
export function TitledSection(props: TitledSectionProps): JSX.Element {
    const { title, children } = props;
    const currentLevel = useContext(LevelContext);
    const heading = typeof title === "string" ? <SectionHeading>{title}</SectionHeading> : title;

    return (
        <>
            {heading}
            <LevelContext.Provider value={currentLevel + 1}>{children}</LevelContext.Provider>
        </>
    );
}

/**
 * Properties supported by the {@link SectionHeading} component.
 *
 * All chakra properties are forwarded to the [Heading](https://chakra-ui.com/docs/components/heading) component.
 */
export interface SectionHeadingProps extends HeadingProps {
    children?: ReactNode | undefined;
}

/**
 * Renders an appropriate heading tag for the current heading level (`h1` through `h6`).
 * This component should only be used as part of the `title` prop of the {@link TitledSection}.
 *
 * Headings are rendered as [Chakra Headings](https://chakra-ui.com/docs/components/heading).
 *
 * Heading levels are managed by nesting {@link TitledSection}.
 */
export const SectionHeading = forwardRef(function SectionHeading(
    props: SectionHeadingProps,
    forwardedRef: ForwardedRef<HTMLHeadingElement>
): JSX.Element {
    const { children, ...rest } = props;
    const level = useHeadingLevel();
    const tag = getHeadingTag(level);
    return (
        <Heading as={tag} ref={forwardedRef} {...rest}>
            {children}
        </Heading>
    );
});

/**
 * Properties for the {@link ConfigureTitledSection} component.
 */
export interface ConfigureTitledSectionProps {
    level: HeadingLevel;
    children?: ReactNode;
}

/**
 * Overrides the heading level for all children.
 *
 * TitledSection components nested in `children` will start with the configured level.
 * Nested TitledSections will continue to use the next appropriate heading level.
 *
 * Example: Changing the global heading level for your application
 *
 * If your application is embedded into another site, it should often not use the `h1` tag
 * but start with a higher heading level instead. To achieve that, simply wrap your application
 * with `<ConfigureTitledSectionProps>`. No other code changes are necessary:
 *
 * ```jsx
 * <ConfigureTitledSection level={2}>
 *     <TheRestOfYourApplication />
 * </ConfigureTitledSection>
 * ```
 *
 * Example: Embedding a widget
 *
 * Given a `<Widget />` (that we cannot easily change) that internally uses `TitledSection`,
 * this is how we can embed it with a custom heading level.
 * This can be appropriate in some circumstances, for example when the react component tree does not match the DOM
 * tree (portals etc.).
 *
 * ```jsx
 * <ConfigureTitledSection level={5}>
 *     <Widget />
 * </ConfigureTitledSection>
 * ```
 *
 * The headings used by `Widget` will start with `h5`.
 *
 */
export const ConfigureTitledSection: FC<ConfigureTitledSectionProps> = (props) => {
    return <LevelContext.Provider value={props.level}>{props.children}</LevelContext.Provider>;
};

/** The level of a html heading. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Returns the current heading level.
 *
 * This hook should be used in the `title` property of a {@link TitledSection}.
 */
export function useHeadingLevel(): HeadingLevel {
    const level = useContext(LevelContext);
    return Math.min(level, 6) as HeadingLevel;
}

function getHeadingTag(level: HeadingLevel): `h${HeadingLevel}` {
    return `h${level}`;
}
