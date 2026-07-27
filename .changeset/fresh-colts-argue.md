---
"@open-pioneer/map": minor
---

`useMapModel` now prints an error message if the map model could not be created.
This error was previously returned and was easy to silently ignore.

Use the option `quiet: true` to suppress this error message.
