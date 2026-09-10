# v1.7 Export Restore

Restores the CropLab v1.5 export presentation and styling while preserving the v1.7 history integration.

Changes:
- Restore the v1.5 ExportPanel structure and visual behavior.
- Preserve v1.7 quality interaction callbacks used by history recording.
- Restore the v1.5 export stylesheet import in the App Router layout.
- Remove the v1.7 history CSS rules that overrode the export panel's desktop sizing/padding.
- Preserve the History modal itself.

This patch intentionally does not add new export formats or redesign the export engine. It returns the export UI to the known-good v1.5 presentation before any future export expansion.
