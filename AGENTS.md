# AI Agent Guide: trails-openlayers-base-packages

This repository holds the OpenLayers base packages of the **Open Pioneer Trails** client framework, published to npm
under `@open-pioneer/*`.
`map` wraps an OpenLayers map in a `MapModel` with a reactive layer tree; the other packages are React components and
services for building map apps on top of it.
The framework (runtime, service layer, build tooling) is developed elsewhere and consumed as npm dependencies.

This file is the single source of truth for agents.
`CLAUDE.md` and `.github/copilot-instructions.md` only point here.

## Read next

| Document                                                  | Read it when                                                                                                                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CONTEXT.md](CONTEXT.md)                                  | Always, before touching the code. Defines the project's words and the synonyms to avoid.                                                                                                |
| `.claude/skills/map-package/SKILL.md`                     | Changing `map`: the registry, the map model, a layer class or the map container.                                                                                                        |
| `.claude/skills/component/SKILL.md`                       | Writing or changing a mapping component: props, view model, component API, layer attributes, UI and accessibility rules.                                                                |
| `.claude/skills/test/SKILL.md`                            | Writing or fixing a test.                                                                                                                                                               |
| `src/packages/<name>/README.md`                           | Changing a package's public API or behavior. The README is published on npm, so it changes with the code.                                                                               |
| `docs/` in https://github.com/open-pioneer/trails-starter | Framework questions: `reference/Package.md` for `build.config.mjs`, `reference/Services.md` for services. It may be checked out as `../trails-starter`; otherwise fetch it from GitHub. |
| `docs/agents/`                                            | Running one of the engineering skills. See [Agent skills](#agent-skills).                                                                                                               |

## Architecture

```
src/packages/<name>/   Published @open-pioneer/* packages, sources at the package root, tests next to the code
src/samples/<name>/    One directory per sample with an index.html and one app package; src/index.html links them by hand
src/testing/           Vitest global setup and the private workspace package `test-utils`
support/, patches/     Build scripts, license config and the pnpm patches
```

Every package is a Trails package: its `build.config.mjs` declares entry points, services, UI references, i18n and
styles.
`src/samples/busradar-demo/` and `src/samples/packages/` are untracked leftovers without sources; ignore them.

`map` is the foundation; every other package except `ogc-features` and `map-ui-components` depends on it.
A `MapModel` wraps the `OlMap`, exposes the view state as reactive getters and owns the layer tree (`layers`), the
`highlights` and the `overlays`.
Layers are created through the `LayerFactory` service and attached to the model, which syncs the OpenLayers layer
order; the `olMap` and `olLayer` are public, but composition, visibility and attributes go through the model's API
because the components observe the model, not OpenLayers.
Components take the map as a `map` prop or from a `DefaultMapProvider`, never as an id.

A component package is laid out as `api.ts` or `api/` (public types), `model/` (view model) and `ui/` (React).
State lives in a view model class built from signals; React reads it with `useReactiveSnapshot()`.
Components configure themselves from layer attributes (`legend`, `toc`) and from app-provided sources
(`SearchSource`, `SelectionSource`).
`editing` is the older service-only editor for OGC API Features; `feature-editing` is the newer component with forms
and undo.
`map-test-utils` is published but is test support; `setupMap()` builds a real registry from the unstable
`@open-pioneer/map/internalTestSupport` entry point.

## Commands

Run from the workspace root:

- **Dev server**: `pnpm dev`. Vite's root is `src/`, so a sample is served at `/samples/<name>/`.
- **Lint**: `pnpm exec oxlint <path>`, or `pnpm lint`.
- **Format**: `pnpm exec oxfmt <path>`, or `pnpm fmt:check`.
- **Typecheck**: `pnpm check-types` (about 10 seconds).
- **Tests**: `pnpm exec vitest run src/packages/scale-viewer/ScaleViewer.test.tsx`, `-t "name"` for one case, `-u` to
  update snapshots, a directory for one package, no path for everything.
  `pnpm test` is watch mode.
- **Everything CI runs**: `pnpm ci:test`.
- **Package build**: `pnpm build-packages` (or `pnpm build` in the package directory) writes `dist/` for the packages
  and validates their dependencies and file setup.
  Type checks and tests read the sources, so this is only needed to inspect the publishable output.
- **API docs**: `pnpm build-docs` renders TypeDoc for every non-private package into `dist/docs`.

The pre-commit hook checks the lockfile, runs lint-staged, `pnpm check-types` and the tests affected by the change
with `CI=1`, which rejects `.only`.
`NO_VERIFY=1` skips it.

## Toolchain quirks

- **Core packages are pinned in the catalog.**
  `pnpm-workspace.yaml` lists every framework package with one exact version, sometimes a `-dev` snapshot.
  Bumping them changes every line and gets one changeset for all packages.
- **Chakra is pinned and updated by hand.**
  `@ark-ui/react` and `@zag-js/interact-outside` carry patches, so their versions and `@chakra-ui/react` are pinned
  through overrides and excluded from Renovate.
  A Chakra update means re-checking the patches.
- **Dependency resolution prefers old versions** (`resolutionMode: lowest-direct`, three day `minimumReleaseAge`).
  Version bumps go through the catalog; Renovate performs most updates.
- **`pnpm install` fails on duplicate production dependencies** (`support/duplicate-packages.yaml`).

## Changesets

Every change to a published package that a consumer can notice gets a changeset under `.changeset/`.
The summary lands in the package's `CHANGELOG.md`, so write it for the consumer: name the component, prop, interface
or option as the consumer sees it, and say what to do when an old name is deprecated.
Start a breaking change with `**Breaking:**`.
All `@open-pioneer/*` packages are one `fixed` group and share a version; samples and `src/testing/` are never
versioned.

## Code conventions

Oxlint and Oxfmt settle formatting and most style questions; run both on the files you changed.
The rules below are the ones they cannot check, or that you need before writing.

- Every `*.ts`, `*.tsx`, `*.js` and `*.mjs` file starts with this header, followed by a blank line:

    ```ts
    // SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
    // SPDX-License-Identifier: Apache-2.0
    ```

- **No `any` and no `!` outside tests**; use type guards.
  Functions take at most 4 parameters, an options object above that.
- **Log through `createLogger(sourceId)`** with `sourceId` from `open-pioneer:source-info`.
  `console` is allowed only in configs, samples, `src/testing`, `support` and tests.
  AbortErrors rarely need logging (see `isAbortError` from `@open-pioneer/core`).
- **Use `#` for private fields and methods.**
- **Import other packages by name**, never through a relative path that leaves the package.
  Internal helpers that another package in this repository needs go into an entry point marked `@internal`, as
  `map/internalTestSupport.ts` does.
- **Primary exports at the top of a file**, helpers and supporting types below in the order a reader meets them.
- **A component follows `docs/guidelines/UI.md`.**
  Props extend `CommonComponentProps` and `MapModelProps`; the root element gets the package or component name as CSS
  class through `useCommonComponentProps()`; own CSS classes are prefixed with the package name (`measurement-tooltip`);
  Chakra components over plain HTML; no fixed colors, fonts or sizes; `ToolButton` for buttons on the map; icons from
  `react-icons/lu` (Lucide), then Tabler.
  Components that wrap one element forward `ref`.
- **Go through the map model, not OpenLayers.**
  `map.layers.addLayer()`, `layer.setVisible()`, `layer.updateAttributes()`, `map.highlights`, `map.overlays`.
  Touch `olMap` or `olLayer` only for things the model has no API for, and read the OpenLayers state through
  `synchronized()` signals the way `AbstractLayer` does.
- **Create layers with `layerFactory.create({ type, ... })`**, and mark helper layers `internal: true`.
- **A service has three parts in fixed places.**
  The interface in `api.ts` extends `DeclaredService<"<short-name>.<Name>">`, where the short name is the package
  name without the scope.
  The class `<Name>Impl` has its own file, is exported from `services.ts` and is registered under `services` in
  `build.config.mjs` with `provides: "<short-name>.<Name>"`.
- **Everything exported from an entry point is public API.**
  TypeDoc renders it, so it carries a doc comment; `@internal` hides what must be exported for technical reasons.
- **Public API changes are additive.**
  Keep the old name working, mark it `@deprecated` with the alternative, warn at runtime with `deprecated()` from
  `core` where usage can be detected, and write a changeset.
  Removal happens in the next major release.
  Inside a package, a rename updates the callers and leaves no alias behind.
- **Hold state in signals** (`reactive()`, `computed()`, `synchronized()`) in private fields behind plain getters.
  React reads them with `useReactiveSnapshot()`; the oxlint `exhaustive-deps` rule checks its dependency array.
  State that no reactive context reads does not need a signal.
- **Anything that holds a watch handle, an OpenLayers listener, an overlay or a helper layer is a `Resource`.**
  Implement `destroy()`, unregister OpenLayers listeners with `unByKey()`, and release children with
  `destroyResource()` or `destroyResources()` from `core`.
- **Long-running work takes an `AbortSignal`** (search, selection), and callers cancel the previous operation before
  starting the next.
- **User-visible text is translated.**
  React code calls `useIntl()` from `open-pioneer:react-hooks`, and every key exists in both `i18n/en.yaml` and
  `i18n/de.yaml` of the package.
  Tooltips start with a capital letter in both languages.
- **A new sample needs a link in `src/index.html`**; a new component needs a demo in `src/samples/showcase/`.

### Comments

Default to no comment; add one for the why a reader cannot see from the code.
Describe the system as it is now: no history, no former names, no commented-out code, no section banners.
When you change code, update or delete any comment it makes stale.
The exception is the published API, whose doc comments TypeDoc and editor hovers show without the code.

## Writing

Everything you write is read by a human: chat replies, commit messages, pull request text, changeset summaries,
Markdown, doc comments.
Agent documents (communication with subagents, `.scratch/<feature>/issues/*.md`, `.scratch/<feature>/map.md`) are
exempt from the style and layout rules.

Simple, technical English in American spelling.

- **Lead with the answer.**
  Say first, and plainly, what you could not verify; state what you verified as fact.
- **One idea per sentence, about 20 words.**
  Periods and commas; a second sentence instead of an em-dash, semicolon, colon or parentheses.
- **Established words only.**
  Use the words of `CONTEXT.md`, the code and the package READMEs, the same word for the same thing throughout.
- **Concrete over abstract.**
  Name the file, the function, the error, the number; active voice, present tense, named actor.
- **Report, do not narrate.**
  No "I'll now", "Let me", no openers, closers or summaries, no "Additionally".
- **Everyday vocabulary.**
  The sentence stands without load-bearing, robust, seamless, comprehensive, leverage, delve, crucial, "note that",
  "in practice".
- **Say what is.**
  State claims in the affirmative, without a "not X, but Y" frame, "precisely because" or rhetorical questions.
  Call something cheap, fast or rare only with a number behind it.
- **Prose by default.**
  A list only for parallel items, one or two sentences per bullet; bold at most the first words of a bullet; headers
  only above about 500 words; code, commands and error text in fenced blocks; no emoji.

Rendered prose, the Markdown in this repository and the `/** */` doc comments, has three more rules that Oxfmt does
not enforce:

- **One sentence per line.**
  A long sentence may wrap, but two sentences never share a line, so a review diff shows the sentence that changed.
- **A line stays within about 120 characters.**
  Overshoot rather than split a URL, a code span or a `{@link}`.
- **Mark a gap as a gap.**
  An inline `TODO:` for an undecided detail, future tense for a planned part.

## Working in this repository

- **Be direct and critical.**
  If an approach is wrong, a request rests on a false premise, or a change will not do what the user expects, say so
  plainly, give the reason, and propose the alternative.
- **Report results as they are.**
  A failing test is reported as failing, with the output; unverified work is described as unverified.
- **Read the surrounding code before applying generic React or OpenLayers patterns.**
  Deprecated constructors next to the factory, `isBaseLayer` next to `MapConfig.baseLayers`, `useMapModel` next to
  `useMapModelValue` look redundant and are not; "simplifying" one changes behavior for every published app.
- **Prefer extending an existing helper** in `map`, `map-ui-components`, `map-test-utils` or the package at hand over
  adding a parallel mechanism.
- **Make the change the task asks for.**
  Leave unrelated code, comments and formatting as they are.
- **Parallel agent work goes in `.worktrees/<unit>`** (gitignored), created with `git worktree add`, never under
  `.claude/`.

## Keeping this guide current

If this guide, `CONTEXT.md`, a skill under `.claude/skills/` or a file under `docs/agents/` states something false,
fix it as part of the task and mention the change to the user.
Propose any other change, such as a new rule or a reworded convention, to the user instead of making it.

## Agent skills

Configuration for the agent workflow skills.
Each file below is the contract for one part of the workflow; read it before acting on the topic it covers.

### Issue tracker

Issues and specs for agent work are files under `.scratch/` in this repository.
The GitHub issues of `open-pioneer/trails-openlayers-base-packages` are for people and stay untouched.
See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

The sources of truth for a task are the user's messages, the documentation and the code.
A ticket, plan or spec found in the tree is an unverified draft, usually from an earlier agent session.
Read one when the user or a skill points you to it; before relying on it, name it and confirm with the user that it
still holds.

### Triage labels

Triage state is a `Status:` line inside each issue file, using the five canonical role names plus `done`.
See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context layout: one `CONTEXT.md` at the repository root and decision records in `docs/adr/`.
Read `CONTEXT.md` before touching the code; it defines the project's words and the synonyms to avoid.
See [docs/agents/domain.md](docs/agents/domain.md).
