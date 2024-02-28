# @open-pioneer/theme

This package provides a theme that uses the "trails" color scheme.

This theme is based on `@open-pioneer/base-theme`.
It may define additional style rules that diverge from the global default theme.

## Usage

To use the theme in your app, first import:

```jsx
import { theme } from "@open-pioneer/theme";
```

Then pass in the theme in `createCustomElement`:

```jsx
createCustomElement({
    ...,
    theme
});
```

See `@open-pioneer/base-theme` for more details.

## License

Apache-2.0 (see `LICENSE` file)
