# Neural Charts Web pilot

The pilot covers one analytics screen with a trend, category comparison and a distribution. Keep the prototype in the Core repository branch to review its scope. The proposed publishing boundary is a separate Web package; its name and renderer remain open.

| Chart | Scenario | Data |
| --- | --- | --- |
| Line | Trend in closed cases | Day labels for one selected period |
| Bar | Compare work across teams | Discrete team labels and counts |
| Donut | Explain distribution by status | Named nonnegative counts and their total |

The component receives data and theme values. The application owns timespan, URL State, selected items, localization and transport. The browser implementation should support chart-to-table selection without doing a second query. The current pilot uses inline SVG to test the interface and accessibility with real DOM. Compare its limits with a renderer library using a reproducible fixture before selecting the production engine.

The screen must expose a data table with headings and values. Legends and filter controls use buttons with a visible focus indicator. Color cannot be the sole identifier. Keep chart data and a readable representation available during SSR. A resize must retain the selected series, focus and corresponding table row.

Out of pilot scope: new native APIs, a general chart engine, financial charts, export, animation, zoom, full dashboards, and publication to npm.

Acceptance checks: narrow and wide renders, English and Spanish number/date formats, keyboard operation, table/visual agreement for zero and missing values, dark and high-contrast modes, and SSR/hydration. The candidate package adds a build-size measurement before any recommendation about the renderer.
