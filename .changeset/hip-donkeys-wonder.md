---
"@open-pioneer/selection": patch
---

Cancel selection requests that are no longer needed.
If the user starts another selection while a request is still running, the previous request is cancelled
and only the results of the most recent selection are used.
