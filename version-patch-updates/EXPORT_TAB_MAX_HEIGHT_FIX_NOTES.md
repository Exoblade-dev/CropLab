# Export Tab max-height fix

This patch changes only `src/export.css`.

The root cause was the base desktop `.workspace-shell` rule having `min-height: 620px`. On a normal browser viewport shorter than that, the workspace could exceed the available height and push the canvas into the footer.

The export-scoped override sets the workspace to the available app-main height with `height: 100%`, `max-height: 100%`, and `min-height: 0`, while the Export panel keeps its own internal scroll area.

No export engine, canvas, editor controls, or other application logic is changed.
