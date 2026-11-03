# Issue tracker: local Markdown files

Issues and specs that agents work from live as Markdown files under `.scratch/` in this repository.
The GitHub issues of `open-pioneer/trails-openlayers-base-packages` are for people; do not create, edit or close them
from a skill.

The `.scratch/` files are committed together with the code on the feature branch, so that everyone on the branch sees
the same tickets.
Delete a feature's directory when its pull request is merged into `main`, and delete stale issues whenever you meet
them.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
  Never collect several tickets into a single file.
- Triage state is a `Status:` line near the top of each issue file.
  The role names are listed in [triage-labels.md](./triage-labels.md).
- Comments and conversation history are appended to the bottom of the file under a `## Comments` heading.

A ticket file therefore starts like this:

```md
# Show the load error of a WMS layer in the TOC

Status: ready-for-agent

When a WMS layer's capabilities request fails, the TOC marks the layer with a generic icon but ...
```

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/`, creating the directory if needed.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path.
The user normally passes the path or the issue number directly.

## Relationship to GitHub issues

When a `.scratch/` ticket implements or fixes a GitHub issue, record it in an `Issue:` line next to `Status:`, for
example `Issue: #606`, so the connection survives and the pull request can reference it.
Reading a GitHub issue with `gh issue view <number> --comments` for context is fine.
Writing to GitHub is not.

## Wayfinding operations

Used by the `wayfinder` skill.
The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` holds the Notes, Decisions-so-far, and Fog sections.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body.
  A `Type:` line records the ticket type (`research`, `prototype`, `grilling`, or `task`); the `Status:` line records
  `claimed` or `resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top.
  A ticket is unblocked once every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; the lowest number
  wins.
- **Claim**: set `Status: claimed` and save the file before doing any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a pointer to the
  answer (a short summary and a link) to the Decisions-so-far section of `map.md`.
