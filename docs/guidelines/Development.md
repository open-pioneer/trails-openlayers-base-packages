# Developer guidelines

## Workflow

-   In general use a pull request to contribute code or documentation changes
    -   Pull requests must be reviewed (see definitions of done)
    -   Exceptions: direct commits for trivial changes (typos in documentation, administrative work)
-   Commits are squashed when PRs are merged
-   Include a changeset entry with your PR when appropriate
-   Include fully qualified issue id in PR title / final commit message (e.g. `open-pioneer/trails-starter#1234`) [TODO: check]
-   Project Board: <https://github.com/orgs/open-pioneer/projects/5>

## Definitions of done

1. Code changes have been reviewed and accepted.
   This includes:
    - Review of code style and quality
    - Review of changes to external APIs
    - Review of changes to public documentation
2. Automated tests for new features have been implemented.
    - Manual tests (only where absolutely necessary) have been documented.
3. All automated tests pass.
4. Features can be demonstrated on the demo deployment.
5. Applicable guidelines have been checked:
    - [UI Guidelines](UIGuidelines.md)
    - [Accessibility guidelines](A11yGuidelines.md)
6. Packages are translated in english and german.
7. Important design decisions or non-obvious things to keep in mind
   have been documented in internal dev notes or comments.
8. A changeset entry was generated (if appropriate) and a CHANGELOG.md exists in the package.
9. Each package contains a `README.md` file that follows the hints in [documentation](#documentation).

## Documentation

-   Use [this template](../templates/package-README.md) to start documenting a new package.
-   Stick to the following documentation guideline, if appropriate: [Documentation guideline](https://developers.google.com/style/highlights)
-   (There is no need to document for each component wether additional CSS classes can be passed using the `className` prop. This is documented in the UI concept documentation.)

## Code style

-   Be strict about TypeScript, especially in public interfaces
-   Use TODO keyword only for things that are currently in doing, not for things that should be implemented anytime in the future. Exceptional: special usages determined by the team.
-   If creating a new package that has a name that consists of multiple words, use a dash to connect the words.

## Tests

-   Tests must have a clear name.
-   Keep tests short and focused.
-   Tests must be readable and easy to understand.
-   Keep tests deterministic (i.e. non-flaky).
-   Regression tests: consider including the issue id.

## Git / IDE-Setup

-   Use eslint & prettier rules (reconfigure if necessary)
-   Use utf-8 text encoding
-   Use unix line endings. On windows, configure git's `autocrlf` feature:

    ```bash
    $ git config --global core.autocrlf input
    ```

    See also <https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration>.

-   Keep a linear history, e.g. by configuring git to always rebase when pulling:

    ```bash
    $ git config --global pull.rebase true
    ```

-   Paths of JavaScript modules can get rather long on windows in combination with PNPM.
    If you see weird errors (I/O errors, file not found, etc.) when you're trying to install dependencies
    or run the development server, try moving the git repository to a shorter path on disk (less nesting, shorter name).

-   Either use eslint's autofix feature or your IDE to ensure that your files contain license headers.

    The following snippet can be used in VSCode.
    Create a snippet via "Ctrl+Shift+P --> Configure User Snippets" (either globally or in this project).
    The following example snippet appears in autocomplete when you start typing "license" in a JavaScript/TypeScript file:

    ```jsonc
    {
        "License header": {
            "scope": "javascript,typescript",
            "prefix": "license",
            "body": [
                "// SPDX-FileCopyrightText: con terra GmbH and contributors",
                "// SPDX-License-Identifier: Apache-2.0"
            ]
        }
    }
    ```
