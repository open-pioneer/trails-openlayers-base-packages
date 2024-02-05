# @open-pioneer/result-list

This package provides a UI component to display Data from other packages, such as the selection.

## Integration UI component

To add the package to your app, import `result-list` from `@open-pioneer/result-list`. To add the UI component take a look at the README.md from sample application. There you can see how the component is installed and how it can be linked to other packages.

## Usage

Note that all data must satisfy the Interface ResultListInput (see api.ts). This means that metadata must also be available for each data column.

### Select / Deselect Data

To select or deselect individual lines, you can click on the checkbox at the beginning of a line. If you want to select or deselect all rows you have to click on the checkbox in the first column header.

### Sorting Data

If you want to sort the data by a single columndate you have to click on the column header. The arrows show in which direction the sorting took place.

## License

Apache-2.0 (see `LICENSE` file)
