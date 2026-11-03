# Triage labels

The skills speak in terms of canonical triage roles.
Because issues in this repository are [Markdown files](./issue-tracker.md) rather than tracker entries, a "label" is the
value of the `Status:` line near the top of the issue file.
Write the role name exactly as it appears in the middle column.

| Role in the skills | Value in the `Status:` line | Meaning                                               |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| `needs-triage`     | `needs-triage`              | Nobody has evaluated this issue yet                   |
| `needs-info`       | `needs-info`                | Waiting on the reporter for more information          |
| `ready-for-agent`  | `ready-for-agent`           | Fully specified, an agent can implement it unattended |
| `ready-for-human`  | `ready-for-human`           | Needs a human to implement it                         |
| `wontfix`          | `wontfix`                   | Will not be worked on                                 |
| —                  | `done`                      | The work is finished; kept for the record             |

`done` is specific to this repository and has no counterpart in the skills.
Set it once the work described by the issue has been completed and verified, in place of the role the issue carried
before.
An issue that is only partly done stays `ready-for-agent`, and its `## Comments` section says which parts are left.
A `done` issue stays in the branch as a record of what was finished, and is removed together with the rest of the
feature's issues when the pull request is merged.
Do not reuse the number of an issue you have marked `done`.

When a skill mentions a role, for example "apply the label that marks an issue ready for an unattended agent", write the
corresponding value from the middle column.
