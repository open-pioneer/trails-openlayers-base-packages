# Accessibility guidelines

## Image text alternatives (“alt text”)
- Every image has an alt-attribute with an appropriate alternative text.
- "icon-only" buttons have aria-labels.

## Headings
- All text that looks like a heading is marked up as a heading.
- All text that is marked up as a heading is really a conceptual section heading.
- The heading hierarchy from \<h1> to \<h6> corresponds to the logic of the content.

## Contrast ratio (“color contrast”)
- Color contrast must be at least 4.5:1 for normal text and 3:1 for larger text (>= 24px) (WCAG AA level).

## Resize text
- The GUI is usable with a 200% text zoom without content overlaps.
- Horizontal scrolling is not required to read sentences or “blocks of text”.

## Keyboard access and visual focus
- All links, buttons and form elements can be reached and operated with the keyboard.
- The keyboard focus is always visible.
- The keyboard focus order is logical within a form / component.

## Forms, labels, and errors
- All form controls have labels (correctly marked up with ‘label’, ‘for’, and ‘id’).
- Necessary instructions are shown before they are needed.
- It is clearly indicated if form fields are required/mandatory (not only by color).
- Form errors are clearly highlighted and guidance to fix the error is given; the errors are easily findable.

## Reading order
- All elements of a form / component in the html tree are ordered in a logical and understandable way.

## Resources
- https://developer.mozilla.org/en-US/docs/Web/Accessibility
- https://www.a11yproject.com/checklist/
- https://moritzgiessmann.de/accessibility-cheatsheet/
- https://wcag.com/developers/
