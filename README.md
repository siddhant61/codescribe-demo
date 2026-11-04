# CodeScribe · Xikolo case study

An independent project by **Siddhant Gadamsetti**, developed with AI assistance, exploring how codebase analysis can support architectural documentation.

This static site presents a historical analysis of the [open-source Xikolo learning platform](https://github.com/openHPI/xikolo-core): architecture reports, an interactive graph, and structured JSON. It is not an official Xikolo or openHPI service.

## Explore

- `index.html`: project introduction and routes through the case study
- `research-methodology.html`: approach and original analysis notes
- `architecture-overview.html`: system overview
- `reports-hub.html`: cluster reports
- `knowledge-graph.html`: interactive relationship explorer
- `idp/knowledge-graph-synthesized.json`: original graph artifact

## Evidence boundaries

The published artifacts are a historical snapshot, not a live scan or a benchmark. Counts differ between reports and graph data. Accuracy, coverage, onboarding improvements and DORA outcomes have not been independently validated by this demonstration. AI-generated explanations and consensus require checking against the relevant source revision. Existing detailed reports and data are preserved as historical artifacts, not silently rewritten to match the new introduction.

## Local preview

No build or dependency installation is required for the site. Serve this directory over HTTP, for example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. The graph and diagrams use existing external D3/Mermaid dependencies, so their full interactive checks need network access.

## Checks

```sh
python -m unittest discover -s tests
node --test tests/*.test.cjs
git diff --check
```

The Python suite verifies public-page branding, accessible content entry, evidence wording and local link/asset destinations. The Node suites cover navigation, graph controls and details-panel interactions. Local Chromium verification covers desktop/mobile layouts, both themes, keyboard navigation, graph interaction and Mermaid rendering; see `docs/browser-verification.md` for evidence and limits.

## Deployment

[Existing GitHub Pages site](https://siddhant61.github.io/ai-workflow-portal/). Local changes are not live until explicitly published through the repository's deployment process.
