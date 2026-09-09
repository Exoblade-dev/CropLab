# Export Tab Full-Height Fix

Export-only patch.

Desktop behavior:
- Workspace uses the available viewport height between header and footer.
- Canvas/workspace cannot grow beyond that height.
- Export panel matches the workspace height.
- Export content scrolls internally when it exceeds the available height.
- Scrollbar track remains transparent and the thumb matches the CropLab UI.
- No React/TypeScript or export-engine changes.
