// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { SectionHeading, TitledSection } from "./TitledSection";

it("renders a hierarchy of headings", () => {
    const renderResult = render(
        <main>
            <TitledSection title="Site title">
                <article>
                    <TitledSection title="Article Title">
                        <TitledSection title="Article Child"></TitledSection>
                    </TitledSection>
                    <TitledSection title="Heading ???"></TitledSection>
                </article>
                <article>
                    <TitledSection title="Other Article"></TitledSection>
                </article>
            </TitledSection>
        </main>
    );

    expect(renderResult.container).toMatchInlineSnapshot(`
      <div>
        <main>
          <h1
            class="chakra-heading css-0"
          >
            Site title
          </h1>
          <article>
            <h2
              class="chakra-heading css-0"
            >
              Article Title
            </h2>
            <h3
              class="chakra-heading css-0"
            >
              Article Child
            </h3>
            <h2
              class="chakra-heading css-0"
            >
              Heading ???
            </h2>
          </article>
          <article>
            <h2
              class="chakra-heading css-0"
            >
              Other Article
            </h2>
          </article>
        </main>
      </div>
    `);
});

it("renders its children", () => {
    const renderResult = render(
        <main>
            <TitledSection title="Site title">Arbitrary content...</TitledSection>
        </main>
    );

    expect(renderResult.container).toMatchInlineSnapshot(`
      <div>
        <main>
          <h1
            class="chakra-heading css-0"
          >
            Site title
          </h1>
          Arbitrary content...
        </main>
      </div>
    `);
});

it("supports manual react nodes as heading", () => {
    const renderResult = render(
        <TitledSection
            title={
                <div className="useless">
                    <SectionHeading>Heading</SectionHeading>
                </div>
            }
        >
            <TitledSection
                title={
                    <div className="useless2">
                        <SectionHeading>Sub Heading</SectionHeading>
                    </div>
                }
            >
                Arbitrary content...
            </TitledSection>
        </TitledSection>
    );

    expect(renderResult.container).toMatchInlineSnapshot(`
      <div>
        <div
          class="useless"
        >
          <h1
            class="chakra-heading css-0"
          >
            Heading
          </h1>
        </div>
        <div
          class="useless2"
        >
          <h2
            class="chakra-heading css-0"
          >
            Sub Heading
          </h2>
        </div>
        Arbitrary content...
      </div>
    `);
});

it("limits heading level to 6", () => {
    const renderResult = render(
        <TitledSection title="1">
            <TitledSection title="2">
                <TitledSection title="3">
                    <TitledSection title="4">
                        <TitledSection title="5">
                            <TitledSection title="6">
                                <TitledSection title="7"></TitledSection>
                            </TitledSection>
                        </TitledSection>
                    </TitledSection>
                </TitledSection>
            </TitledSection>
        </TitledSection>
    );

    expect(renderResult.container).toMatchInlineSnapshot(`
      <div>
        <h1
          class="chakra-heading css-0"
        >
          1
        </h1>
        <h2
          class="chakra-heading css-0"
        >
          2
        </h2>
        <h3
          class="chakra-heading css-0"
        >
          3
        </h3>
        <h4
          class="chakra-heading css-0"
        >
          4
        </h4>
        <h5
          class="chakra-heading css-0"
        >
          5
        </h5>
        <h6
          class="chakra-heading css-0"
        >
          6
        </h6>
        <h6
          class="chakra-heading css-0"
        >
          7
        </h6>
      </div>
    `);
});
