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
5. Accessibility guidelines have been checked (see below).
6. Packages are translated in english and german.
7. Important design decisions or non-obvious things to keep in mind
   have been documented in internal dev notes or comments.

## Accessibility guidelines

-   all elements of a form / component in the html tree must be ordered in a logical and understandable way
-   necessary instructions must be shown before they are needed
-   the language of the application can be programmatically determined

-   all images must have alt-texts.
-   "icon-only" buttons must have aria-labels
-   sections must be separated by headings, these headings must be marked up
-   the text-based sections must be screen-readable

-   the keyboard focus must be visible
-   the keyboard focus order must be logical within a form / component

-   the color contrast must be at least 4.5:1 for normal text (AA level)
    the color contrast should be at least 7:1 for normal text (AAA level)
-   the color contrast must be at least 3:1 for larger text (>= 24px) (AA level)
    the color contrast should be at least 4.5:1 for larger text (>= 24px) (AAA level)

-   all form controls must have labels, these labels must be marked up
-   all form controls must be accessible by keyboard
-   it must be clearly indicated if form fields are required/mandatory; this may not be achieved by color alone
-   form errors must be clearly highlighted and guidance to fix the error shall be given; the errors shall be easily findable
-   the form / component GUI must be usable with a 200% zoom without content overlaps

### Resources

-   https://developer.mozilla.org/en-US/docs/Web/Accessibility
-   https://www.a11yproject.com/checklist/
-   https://moritzgiessmann.de/accessibility-cheatsheet/
-   https://wcag.com/developers/
-   Easy check?
-   IT.NRW document?

## Documentation

## Code style

-   Be strict about TypeScript, especially in public interfaces

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
